// server.js

// 1. Importe 'path' primeiro
const path = require('path');

// 2. Configure dotenv para carregar o arquivo .env do MESMO diretório que server.js
//    usando um caminho absoluto construído com __dirname.
const dotenvConfigPath = path.resolve(__dirname, '.env');
const dotenvResult = require('dotenv').config({ path: dotenvConfigPath });

// 3. Bloco de depuração
if (dotenvResult.error) {
  console.error("---------------------------------------------------------");
  console.error("ERRO AO CARREGAR O ARQUIVO .env:");
  console.error("Erro:", dotenvResult.error.message);
  console.error("Caminho absoluto procurado para .env:", dotenvConfigPath);
  console.error("---------------------------------------------------------");
} else if (dotenvResult.parsed && Object.keys(dotenvResult.parsed).length > 0) {
  console.log("---------------------------------------------------------");
  console.log("Arquivo .env CARREGADO COM SUCESSO.");
  console.log("Caminho usado para .env:", dotenvConfigPath);
  console.log("---------------------------------------------------------");
} else {
  console.warn("---------------------------------------------------------");
  console.warn("dotenv.config() não retornou erro nem variáveis parseadas.");
  console.warn("VERIFIQUE se o arquivo .env existe em:", dotenvConfigPath, "e não está vazio.");
  console.warn("---------------------------------------------------------");
}

// Suas outras requires:
const mysql = require('mysql2');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const { Op } = require("sequelize");
const multer = require('multer');
const expressSession = require('express-session');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const saltRounds = 10;
// Seus models
const { sequelize, Usuario, Solicitacao, Agendamento, Observacao } = require('./models');

// Sincroniza o banco de dados
sequelize.sync({ force: false })
    .then(() => console.log('[DB SYNC] Banco de dados sincronizado com sucesso!'))
    .catch(err => console.error('[DB SYNC ERROR] Erro ao sincronizar o banco de dados:', err));

const app = express();

// Middlewares
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(bodyParser.json());
app.use(cookieParser());


app.use(expressSession({
    
  secret: process.env.SESSION_SECRET || 'YOUR_STRONG_SECRET_KEY_fallback_dev',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Configuração do Multer
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  try {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`[MULTER] Diretório de uploads criado: ${uploadDir}`);
  } catch (mkdirErr) {
      console.error(`[MULTER ERROR] Falha ao criar diretório de uploads: ${uploadDir}`, mkdirErr);
  }
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = file.fieldname.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Funções de E-mail
let emailTransporterInstance = null;
async function initializeEmailTransporter() {
    if (emailTransporterInstance) {
        return emailTransporterInstance;
    }
    if (process.env.SENDGRID_API_KEY && process.env.SENDER_EMAIL) {
        try {
            emailTransporterInstance = nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                secure: false,
                auth: {
                    user: 'apikey',
                    pass: process.env.SENDGRID_API_KEY
                }
            });
            await emailTransporterInstance.verify();
            console.log("[EMAIL_CONFIG] Transporter do SendGrid configurado e verificado.");
            return emailTransporterInstance;
        } catch (sendgridError){
            console.error("[EMAIL_CONFIG_ERROR] SendGrid:", sendgridError.message, "Tentando Ethereal...");
        }
    } else {
        console.warn("[EMAIL_CONFIG_WARN] SENDGRID_API_KEY ou SENDER_EMAIL não definidas. Tentando Ethereal...");
    }

    try {
        let testAccount = await nodemailer.createTestAccount();
        console.log("ETHEREAL (Fallback) - User:", testAccount.user, "Pass:", testAccount.pass);
        console.log("Visualizar e-mails (Ethereal):", nodemailer.getTestMessageUrl(false));

        emailTransporterInstance = nodemailer.createTransport({
            host: testAccount.smtp.host, port: testAccount.smtp.port, secure: testAccount.smtp.secure,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });
        await emailTransporterInstance.verify();
        console.log("[EMAIL_CONFIG] Transporter Ethereal (fallback) configurado.");
        return emailTransporterInstance;
    } catch (etherealError) {
        console.error("[EMAIL_CONFIG_ERROR] Ethereal:", etherealError.message);
        emailTransporterInstance = {
            sendMail: () => { console.error("[EMAIL DUMMY] Envio falhou: Transporter não configurado."); return Promise.reject(new Error("Configuração de e-mail falhou.")); },
            verify: () => { console.error("[EMAIL DUMMY] Verificação falhou: Transporter não configurado."); return Promise.reject(new Error("Configuração de e-mail falhou.")); }
        };
        return emailTransporterInstance;
    }
}
initializeEmailTransporter().catch(err => console.error("[EMAIL INIT FAIL]", err));

async function enviarEmailConfirmacaoAgendamento(emailDestinatario, nomeAluno, dataAgendamento, horaAgendamento, nomePsicopedagoga = "Educa Mente") {
    if (!emailDestinatario || !/\S+@\S+\.\S+/.test(emailDestinatario)) {
         console.error(`[EMAIL SEND REJECT] E-mail do destinatário inválido/não fornecido: ${emailDestinatario}`);
         return;
    }
    const remetenteEmail = process.env.SENDER_EMAIL || 'noreply@seu-dominio.com';
    const transporter = await initializeEmailTransporter();
    if (!transporter || typeof transporter.sendMail !== 'function') {
        console.error("[EMAIL SEND FAIL] Transporter não inicializado, e-mail não enviado.");
        return;
    }
    try {
        const dataObj = new Date(`${dataAgendamento}T${horaAgendamento || '00:00'}:00`);
        const dataFormatada = !isNaN(dataObj.getTime()) ? dataObj.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'long', year: 'numeric' }) : 'Data inválida';
        const horaFormatada = !isNaN(dataObj.getTime()) ? dataObj.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }) : 'Hora inválida';

        const mailOptions = {
            from: `"Educa Mente Agendamentos" <${remetenteEmail}>`, to: emailDestinatario,
            subject: 'Confirmação de Agendamento - Educa Mente ✔',
            text: `Olá ${nomeAluno || 'Aluno(a)'},\n\nSeu agendamento com ${nomePsicopedagoga} foi confirmado!\n\nData: ${dataFormatada}\nHorário: ${horaFormatada}\n\nAtenciosamente,\nEquipe Educa Mente`,
            html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#333"><h2 style="color:#0A4275">Confirmação de Agendamento</h2><p>Olá <strong>${nomeAluno||'Aluno(a)'}</strong>,</p><p>Seu agendamento com <strong>${nomePsicopedagoga}</strong> foi confirmado!</p><br><div style="padding:15px;border-left:4px solid #1575A3;background-color:#f4f8fa;margin-bottom:15px"><p style="margin:5px 0"><strong>Data:</strong> ${dataFormatada}</p><p style="margin:5px 0"><strong>Horário:</strong> ${horaFormatada}</p></div><p>Atenciosamente,<br><strong>Equipe Educa Mente</strong></p></div>`
        };
        let info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SEND SUCCESS] Para ${emailDestinatario}. ID: ${info.messageId}`);
        if (nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)) {
            console.log('[EMAIL PREVIEW URL (Ethereal)]:', nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error(`[EMAIL SEND CRITICAL] Para ${emailDestinatario}:`, error);
    }
}

// --- Middleware de Autenticação ---
function requireLogin(tiposPermitidos = []) {
    return (req, res, next) => {
        console.log('[SESSION DEBUG]', req.session);
        if (!req.session.usuarioId) {
            console.warn(`[AUTH REJECT] ${req.method} ${req.originalUrl}: Não logado.`);
            return req.originalUrl.startsWith('/api/') ? res.status(401).json({ error: 'Autenticação necessária.' }) : res.redirect('/login?tipo=psicopedagoga');
        }
        if (Array.isArray(tiposPermitidos) && tiposPermitidos.length > 0 && !tiposPermitidos.includes(req.session.tipoUsuario)) {
            console.warn(`[AUTH REJECT] ${req.method} ${req.originalUrl}: Tipo '${req.session.tipoUsuario}' não permitido. UserID: ${req.session.usuarioId}`);
            return req.originalUrl.startsWith('/api/') ? res.status(403).json({ error: 'Acesso negado.' }) : res.status(403).send('Acesso negado.');
        }
        next();
    };
}

// Rotas de páginas HTML
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'views', 'index.html')); });
app.get('/login', (req, res) => { res.sendFile(path.join(__dirname, 'views', 'login.html'))});
app.get('/cadastro', (req, res) => { res.sendFile(path.join(__dirname, 'views', 'cadastro.html')); });

app.get('/formulario', requireLogin(['aluno', 'professor', 'psicopedagoga']), (req, res) => { res.sendFile(path.join(__dirname, 'views', 'formulario.html')); });
app.get('/confirmacao', requireLogin(['aluno', 'professor', 'psicopedagoga']), (req, res) => { res.sendFile(path.join(__dirname, 'views', 'confirmar_envio.html')); });

app.get('/painel', requireLogin(['psicopedagoga']), (req, res) => { res.sendFile(path.join(__dirname, 'views', 'painel.html')); });
app.get('/historico', requireLogin(['psicopedagoga']), (req, res) => { res.sendFile(path.join(__dirname, 'views', 'historico.html')); });
app.get('/solicitacoes', requireLogin(['psicopedagoga']), (req, res) => { res.sendFile(path.join(__dirname, 'views', 'solicitacoes.html')); });
app.get('/agendamento', requireLogin(['psicopedagoga']), (req, res) => { res.sendFile(path.join(__dirname, 'views', 'agendamento.html')); });
app.get('/detalhes', requireLogin(['psicopedagoga']), (req, res) => { res.sendFile(path.join(__dirname, 'views', 'detalhes.html')); });
app.get('/historico_aluno', requireLogin(['psicopedagoga']), (req, res) => { res.sendFile(path.join(__dirname, 'views', 'historico_aluno.html')); });

app.get('/erro', (req, res) => { res.sendFile(path.join(__dirname, 'views', 'pagina_erro_generica.html')); });

app.get('/aluno/:id', requireLogin(['psicopedagoga']), (req, res) => {
    const htmlPath = path.join(__dirname, 'views', 'detalhes_aluno_template.html');
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        console.error(`[404 SEND FILE] Template de aluno não encontrado: ${htmlPath}`);
        res.status(404).send("Template da página do aluno não encontrada.");
    }
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) { console.error("[LOGOUT ERROR]", err); return res.status(500).send("Erro ao fazer logout."); }
        res.clearCookie('connect.sid');
        console.log("[LOGOUT SUCCESS]");
        res.status(200).json({ message: 'Logout bem-sucedido' });
    });
});

// Função auxiliar para enviar página de erro ou fallback
function sendErrorPage(res, statusCode, pageName, fallbackMessage) {
    // Se pageName for um tipo de erro para a nova página genérica
    const tiposConhecidos = [
        'cadastro_campos_obrigatorios', 'cadastro_email_existente',
        'login_campos_obrigatorios', 'login_aluno_nao_encontrado', /* ... outros tipos ... */
        'erro_interno', 'nao_autorizado', 'nao_encontrado'
    ];

    if (tiposConhecidos.includes(pageName)) {
        console.log(`[sendErrorPage] Redirecionando para /erro?tipo=${pageName}`);
        return res.redirect(`/erro?tipo=${pageName}`);
    }
    
    const errorPagePath = path.join(__dirname, 'views', pageName);
    if (fs.existsSync(errorPagePath)) {
        console.log(`[sendErrorPage] Enviando página de erro específica: ${pageName}`);
        return res.status(statusCode).sendFile(errorPagePath);
    } else {
        console.warn(`[sendErrorPage] Arquivo de erro não encontrado: ${pageName}. Usando fallback ou redirecionando para erro genérico.`);
        // Fallback para a página genérica se o arquivo não for encontrado e não for um tipo conhecido
        return res.status(statusCode).redirect(`/erro?tipo=desconhecido&msg=${encodeURIComponent(fallbackMessage)}`);
    }
}


// Cadastro de aluno
app.post('/cadastro_aluno', async (req, res) => {
    
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        console.warn(`[CADASTRO REJECT] Senhas não coincidem para: ${email}`);
        return res.status(400).send('As senhas não coincidem.');
    }

    if (!name || !email || !password) {
        console.warn("[CADASTRO REJECT] Campos de cadastro obrigatórios não preenchidos.");
        return res.redirect('/erro?tipo=cadastro_campos_obrigatorios');
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        console.warn(`[CADASTRO REJECT] Formato de email inválido: ${email}`);
        return res.status(400).send('Formato de e-mail inválido.');
    }
    if (password.length < 6) {
        console.warn(`[CADASTRO REJECT] Senha muito curta para: ${email}`);
        return res.status(400).send('A senha deve ter pelo menos 6 caracteres.'); // Não há página específica listada
    }

    try {
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            console.warn(`[CADASTRO REJECT] E-mail já cadastrado: ${email}`);
            return res.redirect(`/erro?tipo=cadastro_email_existente&email=${encodeURIComponent(email)}`);
        }
        const senhaHash = await bcrypt.hash(password, saltRounds);
        await Usuario.create({ nome: name, email: email, senha: senhaHash, tipo: 'aluno' }); // IMPLEMENTAR HASH
        console.log(`[CADASTRO SUCCESS] Aluno: ${email}`);
        res.redirect('/login?tipo=aluno&cadastro=sucesso');

    } catch (err) {
        console.error("[CADASTRO CRITICAL]", err);
        return res.redirect('/erro?tipo=erro_interno');
    }
});

// Login
app.post('/login', async (req, res) => {
    const { email, password, tipoEsperado } = req.body;

    if (!email || !password || !tipoEsperado) {
        console.warn("[LOGIN REJECT] Campos de login obrigatórios não preenchidos.");
        return res.redirect('/erro?tipo=login_campos_obrigatorios');
    }

    const tiposValidos = ['aluno', 'professor', 'psicopedagoga'];
    if (!tiposValidos.includes(tipoEsperado)) {
         console.warn(`[LOGIN REJECT] Tipo esperado inválido recebido: ${tipoEsperado}`);
         return res.status(400).send('Tipo de login inválido.'); // Não há página específica listada
    }

    try {
        const usuario = await Usuario.findOne({ where: { email } });

        if (!usuario) {
            console.warn(`[LOGIN FAIL] E-mail não encontrado: ${email} (tentativa ${tipoEsperado})`);
            return res.redirect(`/erro?tipo=login_usuario_nao_encontrado&contextoLogin=${encodeURIComponent(tipoEsperado)}`);
        }

        // Compara senha hasheada
        let match = false;
         try {
            match = await bcrypt.compare(password, usuario.senha);
        } catch {
            // bcrypt.compare pode lançar erro se usuario.senha não for hash válido
            match = false;
        }

        if (!match) {
            match = (password === usuario.senha);
        }

        if (!match) {
            console.warn(`[LOGIN FAIL] Senha incorreta para ${email} (tentativa ${tipoEsperado})`);
            return res.redirect(`/erro?tipo=login_senha_incorreta&contextoLogin=${encodeURIComponent(tipoEsperado)}`);
        }

        if (usuario.tipo !== tipoEsperado) {
            console.warn(`[LOGIN FAIL] Tipo de conta incorreto para ${email}. Tentou ${tipoEsperado}, é ${usuario.tipo}.`);
            let correctLoginPage = {'psicopedagoga':'/login_psico','professor':'/login_professor','aluno':'/login_aluno'}[usuario.tipo] || '/';
            let userTypeName = {'psicopedagoga':'Psicopedagoga','professor':'Professor(a)','aluno':'Aluno(a)'}[usuario.tipo] || 'Desconhecido';
            let attemptedLoginArea = tipoEsperado.charAt(0).toUpperCase() + tipoEsperado.slice(1);

            // Tenta enviar a página 'erro_login_tipo_incorreto.html'
            // Se ela não for feita para receber variáveis, a mensagem será estática.
            const params = new URLSearchParams({
                tipo: 'login_tipo_incorreto',
                userEmail: encodeURIComponent(email),
                userTypeName: encodeURIComponent(userTypeName),
                attemptedArea: encodeURIComponent(attemptedLoginArea),
                correctLoginPath: encodeURIComponent(correctLoginPage)
            });
            return res.redirect(`/erro?${params.toString()}`);
        }

        req.session.regenerate(err => {
            if (err) { console.error('[LOGIN SESSION ERROR]', err); return res.redirect('/erro?tipo=erro_interno'); }
        
            req.session.usuarioId = usuario.id;
            req.session.tipoUsuario = usuario.tipo;
            req.session.nomeUsuario = usuario.nome;
            req.session.save(() => {
                console.log('[LOGIN SESSION SALVA]', req.session);
            });
        
            // Define cookie acessível via JavaScript com o tipo e nome de usuário
            res.cookie('tipoUsuario', usuario.tipo, {
                maxAge: 24 * 60 * 60 * 1000, 
                sameSite: 'Lax',
                httpOnly: false 
            });

            res.cookie('nomeUsuario', usuario.nome, { 
                maxAge: 24 * 60 * 60 * 1000, 
                sameSite: 'Lax',
                httpOnly: false 
            });
        
            console.log(`[LOGIN SUCCESS] User: ${usuario.nome} (ID: ${usuario.id}), Tipo: ${usuario.tipo}.`);
            
            let redirectPath;
            if (usuario.tipo === 'psicopedagoga') {
                redirectPath = '/painel';
            } else if (usuario.tipo === 'aluno' || usuario.tipo === 'professor') {
                redirectPath = '/formulario'; // Todos os outros vão para o formulário unificado
            } else {
                redirectPath = '/'; // Fallback
            }  
            res.redirect(redirectPath);
        });
        
    } catch (err) {
        console.error("[LOGIN CRITICAL]", err);
        return res.redirect('/erro?tipo=erro_interno');
    }
});

// API para verificar usuário logado
app.get('/api/usuario-logado', requireLogin(), (req, res) => {
    res.json({ logado: true, usuarioId: req.session.usuarioId, tipoUsuario: req.session.tipoUsuario, nome: req.session.nomeUsuario });
});

// Rota de Enviar Solicitação
app.post('/enviar_solicitacao', requireLogin(['aluno', 'psicopedagoga', 'professor']), upload.single('file'), async (req, res) => {
    const { name, age, course, shift, classroom, phone, responsible, institution, observations, outro_motivo, outro_curso} = req.body;
    if (!name || !age || !course || !shift || !classroom) return res.status(400).send("Campos obrigatórios não preenchidos.");
    try {
        const novaSolicitacao = await Solicitacao.create({
            nome: name.trim(), data_nascimento: age, curso: (course === 'Outro' && outro_curso) ? outro_curso.trim() : course,
            turno: shift, turma: classroom, telefone: phone || null, responsavel: responsible || null,
            instituicao: institution || null, obser: (outro_motivo || observations || '').trim() || null,
            laudo: !!req.file, imagem: req.file ? req.file.filename : null,
            usuario_id: req.session.usuarioId, status: 'Pendente',
        });
        console.log(`[SOLICITACAO SUCCESS] ID: ${novaSolicitacao.id} por User ID: ${req.session.usuarioId}`);
        res.redirect('/confirmacao');
    } catch (err) {
        console.error(`[SOLICITACAO CRITICAL] User ID ${req.session.usuarioId}:`, err);
        res.status(500).send('Erro interno ao processar solicitação.');
    }
});

// --- ROTAS DE API PARA PSICOPEDAGOGA ---
app.get('/api/solicitacoes', requireLogin(['psicopedagoga']), async (req, res) => {
    try {
        const solicitacoesData = await Solicitacao.findAll({
            order: [['criado_em', 'DESC']],
            include: [{
                model: Agendamento,
                as: 'agendamentos',
                required: false,
                attributes: ['id', 'data_agendamento', 'horario', 'obser_agendamento'],
                order: [['data_agendamento', 'ASC'], ['horario', 'ASC']]
            }]
        });
        const solicitacoes = solicitacoesData.map(s => {
            const plain = s.get({ plain: true });
            if (plain.agendamentos && plain.agendamentos.length > 0) {
                const ultimoAgendamento = plain.agendamentos[plain.agendamentos.length - 1];
                plain.data_ultimo_agendamento = ultimoAgendamento.data_agendamento;
                plain.hora_ultimo_agendamento = ultimoAgendamento.horario ? ultimoAgendamento.horario.substring(0, 5) : null;
                plain.todos_agendamentos = plain.agendamentos || [];
            }

            plain.laudoPath = plain.imagem ? `/uploads/${plain.imagem}` : null;
            return plain;
        });
        res.json(solicitacoes);
    } catch (err) {
        console.error("[API ERROR] /api/solicitacoes:", err);
        res.status(500).json({ error: "Erro interno ao buscar solicitações" });
    }
});

app.get('/api/solicitacoes/pendentes', requireLogin(['psicopedagoga']), async (req, res) => {
    try {
        const pendentes = await Solicitacao.findAll({
            where: { status: 'Pendente' }, order: [['criado_em', 'DESC']], limit: 5,
            attributes: ['id', 'nome', 'criado_em']
        });
        res.json(pendentes);
    } catch (err) {
        console.error("[API ERROR] /api/solicitacoes/pendentes:", err);
        res.status(500).json({ error: "Erro ao buscar pendentes" });
    }
});

app.get('/api/solicitacoes/:id', requireLogin(['psicopedagoga']), async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    try {
        const solicitacao = await Solicitacao.findByPk(id, {
            include: [{
                 model: Agendamento, as: 'agendamentos', required: false,
                 attributes: ['id', 'data_agendamento', 'horario', 'obser_agendamento'],
                 order: [['data_agendamento', 'DESC'], ['horario', 'DESC']]
            }]
        });
        if (!solicitacao) return res.status(404).json({ error: 'Solicitação não encontrada.' });
        const plain = solicitacao.get({ plain: true });
        if (plain.agendamentos && plain.agendamentos.length > 0) {
            plain.data_agendamento = plain.agendamentos[0].data_agendamento;
            plain.hora_agendamento = plain.agendamentos[0].horario ? plain.agendamentos[0].horario.substring(0, 5) : null;
            plain.obser_agendamento = plain.agendamentos[0].obser_agendamento;
        }
        plain.laudoPath = plain.imagem ? `/uploads/${plain.imagem}` : null;
        res.json(plain);
    } catch (err) {
        console.error(`[API ERROR] /api/solicitacoes/${id}:`, err);
        res.status(500).json({ error: "Erro ao buscar detalhes da solicitação" });
    }
});

app.put('/api/solicitacoes/:id/status', requireLogin(['psicopedagoga']), async (req, res) => {
    const id = parseInt(req.params.id);
    const { status: novoStatus } = req.body;
    const validStatus = ['Pendente', 'Aprovado', 'Rejeitado', 'Agendado', 'Finalizado'];
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    if (!novoStatus || !validStatus.includes(novoStatus)) return res.status(400).json({ error: `Status inválido. Válidos: ${validStatus.join(', ')}` });

    try {
        const solicitacao = await Solicitacao.findByPk(id);
        if (!solicitacao) return res.status(404).json({ message: 'Solicitação não encontrada.' });
        const statusAntigo = solicitacao.status;
        if (statusAntigo === novoStatus) return res.status(200).json({ message: `Status já é ${novoStatus}` });

        let agendamentosRemovidos = 0;
        if (statusAntigo === 'Agendado' && ['Aprovado', 'Pendente', 'Rejeitado'].includes(novoStatus)) {
             await sequelize.transaction(async (t) => {
                 agendamentosRemovidos = await Agendamento.destroy({ where: { solicitacoes_id: id }, transaction: t });
                 await Solicitacao.update({ status: novoStatus }, { where: { id }, transaction: t });
             });
             console.log(`[STATUS CHANGE] ${id}: ${statusAntigo} -> ${novoStatus}. Agendamentos removidos: ${agendamentosRemovidos}. User: ${req.session.usuarioId}`);
        } else {
            await Solicitacao.update({ status: novoStatus }, { where: { id } });
            console.log(`[STATUS CHANGE] ${id}: ${statusAntigo} -> ${novoStatus}. User: ${req.session.usuarioId}`);
        }
        res.status(200).json({ message: `Status atualizado para ${novoStatus}`, agendamentosRemovidos });
    } catch (error) {
        console.error(`[API STATUS CHANGE CRITICAL] ID ${id}:`, error);
        res.status(500).json({ message: 'Erro ao atualizar status.' });
    }
});

app.post('/api/agendar', requireLogin(['psicopedagoga']), async (req, res) => {
    const { solicitacaoId: solicitacaoIdForm, data: dataForm, hora: horaForm, observacoes: observacoesForm } = req.body;
    const solicitacaoIdNum = parseInt(solicitacaoIdForm);

    if (isNaN(solicitacaoIdNum)) return res.status(400).json({ message: 'ID da solicitação inválido.' });
    if (!dataForm || !/^\d{4}-\d{2}-\d{2}$/.test(dataForm)) return res.status(400).json({ message: 'Formato de data inválido (AAAA-MM-DD).' });
    if (!horaForm || !/^\d{2}:\d{2}$/.test(horaForm)) return res.status(400).json({ message: 'Formato de hora inválido (HH:MM).' });

    const dataAgendamento = dataForm;
    const horarioCompleto = `${horaForm}:00`;

    try {
        const solicitacaoParaAgendar = await Solicitacao.findByPk(solicitacaoIdNum, { include: [{ model: Usuario, as: 'usuario', attributes: ['email', 'nome'] }] });
        if (!solicitacaoParaAgendar) return res.status(404).json({ message: 'Solicitação não encontrada.' });

        const statusPermitidosParaAgendar = ['Pendente', 'Aprovado', 'Agendado', 'Finalizado'];
        if (!statusPermitidosParaAgendar.includes(solicitacaoParaAgendar.status)) {
             return res.status(409).json({ message: `Não é possível agendar solicitação com status "${solicitacaoParaAgendar.status}".` });
        }

        const conflito = await Agendamento.findOne({ where: { data_agendamento: dataAgendamento, horario: horarioCompleto, solicitacoes_id: { [Op.ne]: solicitacaoIdNum } } });
        if (conflito) {
            const solicitacaoConflito = await Solicitacao.findByPk(conflito.solicitacoes_id, { attributes: ['nome'] });
            return res.status(409).json({ message: `Horário ocupado por ${solicitacaoConflito?.nome || 'outro aluno'}.` });
        }

        const resultado = await sequelize.transaction(async (t) => {
            const novoAgendamento = await Agendamento.create({
                solicitacoes_id: solicitacaoIdNum, data_agendamento: dataAgendamento, horario: horarioCompleto,
                obser_agendamento: observacoesForm ? observacoesForm.trim() : null
            }, { transaction: t });
            const [updatedRows] = await Solicitacao.update({ status: 'Agendado' }, { where: { id: solicitacaoIdNum }, transaction: t });
            if (updatedRows === 0 && solicitacaoParaAgendar.status !== 'Agendado') {
                throw new Error(`Falha ao atualizar status para Agendado para solicitação ${solicitacaoIdNum}.`);
            }
            return { novoAgendamento };
        });

        const usr = solicitacaoParaAgendar.usuario;
        if (usr && usr.email) {
            enviarEmailConfirmacaoAgendamento(usr.email, solicitacaoParaAgendar.nome, dataAgendamento, horaForm, req.session.nomeUsuario || "Equipe Educa Mente");
        }
        res.status(201).json({ message: 'Agendamento confirmado!', agendamento: resultado.novoAgendamento });
    } catch (error) {
        console.error('[API /agendar CRITICAL]', error);
        res.status(error.message.includes('ocupado por') || error.message.includes('Falha ao atualizar status') ? 409 : 500)
           .json({ message: error.message || 'Erro interno ao agendar.' });
    }
});

app.get('/api/historico_por_id/:id', requireLogin(['psicopedagoga']), async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID da solicitação inválido.' });

    try {
        const solicitacao = await Solicitacao.findByPk(id, {
            include: [{
                model: Agendamento,
                as: 'agendamentos', // Assegure-se que o alias 'agendamentos' está correto no model Solicitacao
                required: false,
                attributes: ['id', 'data_agendamento', 'horario', 'obser_agendamento', 'criado_em'], // 'obser_agendamento' é a observação GERAL do agendamento
                order: [['data_agendamento', 'ASC'], ['horario', 'ASC']],
                include: [{
                    model: Observacao,
                    as: 'observacoes', // Assegure-se que o alias 'observacoes' está correto no model Agendamento
                    attributes: ['id', 'texto', 'criado_em'], // Campos que você quer da Observacao
                    required: false, // `false` para não excluir agendamentos sem observações
                    order: [['criado_em', 'DESC']] // Ou a ordem que preferir para as observações
                }]
            }]
        });

        if (!solicitacao) return res.status(404).json({ error: "Solicitação não encontrada." });

        const plainSolicitacao = solicitacao.get({ plain: true });

        const alunoResponse = {
            solicitacaoId: plainSolicitacao.id,
            studentName: plainSolicitacao.nome,
            studentAge: plainSolicitacao.data_nascimento, // Formato YYYY-MM-DD
            curso: plainSolicitacao.curso,
            grade: plainSolicitacao.turma,
            phone: plainSolicitacao.telefone,
            unit: plainSolicitacao.instituicao,
            responsible: plainSolicitacao.responsavel,
            initialObservations: plainSolicitacao.obser, // Observações iniciais da solicitação
            laudoPath: plainSolicitacao.imagem ? `/uploads/${plainSolicitacao.imagem}` : null,
            statusAtual: plainSolicitacao.status,
            criadoEm: plainSolicitacao.criado_em
        };
        const appointmentHistory = plainSolicitacao.agendamentos ? plainSolicitacao.agendamentos.map(ag => {
            let observacaoDoAtendimento = '';
            if (ag.observacoes && ag.observacoes.length > 0) {
                // Exemplo: pegar a mais recente (já que ordenamos por DESC)
                observacaoDoAtendimento = ag.observacoes[0].texto;
                // Se quiser concatenar todas:
                // observacaoDoAtendimento = ag.observacoes.map(obs => obs.texto).join('\n---\n');
            }

            return {
                id: ag.id,
                date: ag.data_agendamento, // Formato YYYY-MM-DD
                horario: ag.horario ? ag.horario.substring(0, 5) : 'N/A', // Formato HH:MM
                // 'obser_agendamento' é a observação geral do agendamento (campo original)
                // 'observacao' (ou nome similar) será a observação específica vinda da tabela Observacao
                observacaoAgendamentoOriginal: ag.obser_agendamento || null, // Observação geral do agendamento (do model Agendamento)
                observacao: observacaoDoAtendimento, // Observação da tabela Observacao
                // Se você quiser passar todas as observações para o frontend lidar com elas:
                // todasObservacoes: ag.observacoes || []
            };
        }) : [];

        res.json({ aluno: alunoResponse, appointmentHistory });

    } catch (err) {
        console.error("[API ERROR] /api/historico_por_id:", err);
        res.status(500).json({ error: "Erro ao buscar histórico do aluno" });
    }
});

app.post('/api/observacoes', requireLogin(['psicopedagoga']), async (req, res) => {
    const { agendamentos_id, texto } = req.body;
    const agendamentoIdNum = parseInt(agendamentos_id);

    if (isNaN(agendamentoIdNum)) return res.status(400).json({ error: "ID do agendamento inválido." });
    
    const textoObservacao = texto ? texto.trim() : null; 
    try {
        const agendamento = await Agendamento.findByPk(agendamentoIdNum);
        if (!agendamento) return res.status(404).json({ error: "Agendamento não encontrado." });

        let observacao = await Observacao.findOne({
            where: { agendamentos_id: agendamentoIdNum },
            order: [['criado_em', 'DESC']] // Pega a mais recente se houver múltiplas
        });

        if (observacao) {
            // Observação existe, então atualiza
            observacao.texto = textoObservacao;
            observacao.usuario_id = req.session.usuarioId; // Atualiza quem modificou por último
            await observacao.save();
            console.log(`[OBSERVACAO UPDATE] ID ${observacao.id} para Agend. ID ${agendamentoIdNum}. User: ${req.session.usuarioId}`);
            res.status(200).json(observacao); // Retorna 200 OK para atualização
        } else {
            // Observação não existe, cria uma nova
            // Só cria se o texto não for nulo/vazio, a menos que você queira criar observações vazias.
            if (textoObservacao !== null && textoObservacao !== '') {
                const novaObservacao = await Observacao.create({
                    agendamentos_id: agendamentoIdNum,
                    texto: textoObservacao,
                    usuario_id: req.session.usuarioId
                });
                console.log(`[OBSERVACAO CREATE] ID ${novaObservacao.id} para Agend. ID ${agendamentoIdNum}. User: ${req.session.usuarioId}`);
                res.status(201).json(novaObservacao); // Retorna 201 Created para nova observação
            } else {
                // Se o texto for vazio e não havia observação, não faz nada ou retorna uma mensagem específica
                console.log(`[OBSERVACAO IGNORED] Texto vazio e nenhuma observação existente para Agend. ID ${agendamentoIdNum}.`);
                res.status(200).json({ message: "Nenhuma observação para criar ou atualizar.", observacao: null });
            }
        }
    } catch (err) {
        console.error("[API ERROR] /api/observacoes POST:", err);
        res.status(500).json({ error: "Erro ao salvar observação" });
    }
});

app.get('/api/agendamentos/semana', requireLogin(['psicopedagoga']), async (req, res) => {
    const { start, end } = req.query;
    if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
        return res.status(400).json({ error: "Datas inválidas (AAAA-MM-DD)." });
    }
    try {
        const agendamentos = await Agendamento.findAll({
            where: { data_agendamento: { [Op.between]: [start, end] } },
            include: [{ model: Solicitacao, as: 'solicitacao', required: true, attributes: ['id', 'nome', 'curso', 'status'] }],
            order: [['data_agendamento', 'ASC'], ['horario', 'ASC']]
        });
        const resultadoFormatado = agendamentos.map(a => ({
            id: a.id, date: a.data_agendamento, time: a.horario ? a.horario.substring(0, 5) : 'N/A',
            studentName: a.solicitacao.nome, type: a.solicitacao.curso, status: a.solicitacao.status,
            solicitacaoId: a.solicitacao.id, completed: a.solicitacao.status === 'Finalizado'
        }));
        res.json(resultadoFormatado);
    } catch (err) {
        console.error("[API ERROR] /api/agendamentos/semana:", err);
        res.status(500).json({ error: "Erro ao buscar agendamentos da semana" });
    }
});

app.get('/api/agendamentos/:id', requireLogin(['psicopedagoga']), async (req, res) => {
    console.log('[SERVER DEBUG] ROTA /api/agendamentos/:id ACESSADA');
    const id = parseInt(req.params.id);
    console.log('[SERVER DEBUG /:id] req.params.id:', req.params.id, 'Parsed ID:', id);

    if (isNaN(id)) {
        console.error('[SERVER VALIDATION FAIL /:id] ID do agendamento inválido:', req.params.id);
        return res.status(400).json({ error: 'ID do agendamento inválido.' });
    }

    try {
        const agendamento = await Agendamento.findByPk(id, {
            include: [{
                model: Solicitacao,
                as: 'solicitacao',
                attributes: ['id', 'nome', 'curso', 'status', 'data_nascimento'] // Adicionei data_nascimento para o cálculo de idade
            }]
        });

        if (!agendamento) {
            console.warn('[SERVER /:id] Agendamento não encontrado para ID:', id);
            return res.status(404).json({ error: 'Agendamento não encontrado.' });
        }

        const plainAgendamento = agendamento.get({ plain: true });

        // Formata e adiciona campos que o frontend espera para viewAppointmentDetails
        const responseData = {
            id: plainAgendamento.id,
            date: plainAgendamento.data_agendamento,
            time: plainAgendamento.horario ? plainAgendamento.horario.substring(0, 5) : 'N/A',
            studentName: plainAgendamento.solicitacao?.nome || 'N/A',
            studentAge: plainAgendamento.solicitacao?.data_nascimento, // Passa a data de nascimento
            grade: plainAgendamento.solicitacao?.curso, // Ou o campo correspondente para série
            type: plainAgendamento.solicitacao?.curso, // Ou um campo específico para tipo/motivo
            completed: plainAgendamento.solicitacao?.status === 'Finalizado', // Lógica de status
            observations: plainAgendamento.obser_agendamento || '', // Observações do agendamento
            // Adicione quaisquer outros campos que `viewAppointmentDetails` espera
        };
        console.log('[SERVER /:id] Enviando detalhes do agendamento:', responseData);
        res.json(responseData);

    } catch (err) {
        console.error(`[API ERROR] /api/agendamentos/${id}:`, err);
        res.status(500).json({ error: "Erro ao buscar detalhes do agendamento." });
    }
});

app.delete('/api/agendamentos/solicitacao/:idSolicitacao', requireLogin(['psicopedagoga']), async (req, res) => {
    const idSolicitacao = parseInt(req.params.idSolicitacao);
    if (isNaN(idSolicitacao)) return res.status(400).json({ error: 'ID da solicitação inválido.' });
    try {
        let agendamentosDeletados = 0;
        await sequelize.transaction(async (t) => {
            agendamentosDeletados = await Agendamento.destroy({ where: { solicitacoes_id: idSolicitacao }, transaction: t });
            if (agendamentosDeletados > 0) {
                const [updatedRows] = await Solicitacao.update(
                    { status: 'Aprovado' },
                    { where: { id: idSolicitacao, status: 'Agendado' }, transaction: t }
                );
                if (updatedRows > 0) console.log(`[AGENDAMENTO DELETE BULK TX] Solic. ${idSolicitacao} revertida para 'Aprovado'.`);
            }
        });
        if (agendamentosDeletados > 0) {
            res.status(200).json({ message: `${agendamentosDeletados} agendamento(s) apagados.` });
        } else {
            res.status(404).json({ message: 'Nenhum agendamento encontrado para esta solicitação.' });
        }
    } catch (error) {
        console.error(`[API AGENDAMENTO DELETE BULK CRITICAL] Solic. ID ${idSolicitacao}:`, error);
        res.status(500).json({ message: 'Erro ao deletar agendamentos por solicitação.' });
    }
});

app.get('/api/dashboard/resumo-dia', requireLogin(['psicopedagoga']), async (req, res) => {
    try {
        const agora = new Date();
        const hojeFormatoDate = agora.toISOString().split('T')[0];
        const inicioDia = new Date(agora);
        inicioDia.setHours(0, 0, 0, 0);
        const fimDia = new Date(agora);
        fimDia.setHours(23, 59, 59, 999);

        const [
            atendimentosHojeNaoFinalizados,
            concluidosHoje,
            novasSolicitacoesPendentesHoje
        ] = await Promise.all([            
            Agendamento.count({
                where: {
                    data_agendamento: hojeFormatoDate, // Agendamentos para a data de hoje
                },
                include: [{
                    model: Solicitacao,
                    as: 'solicitacao',
                    where: {
                        status: { [Op.not]: 'Finalizado' } // O status da SOLICITAÇÃO não é 'Finalizado'
                    },
                    required: true // Garante que apenas agendamentos com solicitação não finalizada sejam contados
                }]
            }),
            Solicitacao.count({
                where: {
                    status: 'Finalizado',
                    atualizado_em: { // Agora o Sequelize sabe sobre este campo
                        [Op.between]: [inicioDia, fimDia]
                    }
                }
            }),
            Solicitacao.count({
                where: {
                    status: 'Pendente',
                    criado_em: { // Sequelize sabe sobre este campo
                        [Op.between]: [inicioDia, fimDia]
                    }
                }
            })
        ]);
        console.log(`[DASHBOARD RESULT] Atend. Hoje (Não Finalizados): ${atendimentosHojeNaoFinalizados}, Concluídos Hoje: ${concluidosHoje}, Novas Solic. Pendentes Hoje: ${novasSolicitacoesPendentesHoje}`);
        res.json({
            atendimentosHoje: atendimentosHojeNaoFinalizados,
            concluidosHoje: concluidosHoje, // Nome da propriedade como o frontend espera
            novasSolicitacoes: novasSolicitacoesPendentesHoje // Nome da propriedade como o frontend espera
        });
        } catch (err) {
        console.error("[API DASHBOARD CRITICAL]", err);
        res.status(500).json({ error: "Erro ao buscar resumo do dia." });
    }
});

app.get('/api/calendario/disponibilidade', requireLogin(['psicopedagoga']), async (req, res) => {
    const { ano, mes } = req.query;
    const anoNum = parseInt(ano); const mesNum = parseInt(mes);
    if (isNaN(anoNum) || isNaN(mesNum) || mesNum < 1 || mesNum > 12 || anoNum < 2000 || anoNum > 2100) {
        return res.status(400).json({ error: "Ano/mês inválidos." });
    }
    try {
        const inicioMesStr = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
        const ultimoDiaMes = new Date(anoNum, mesNum, 0).getDate();
        const fimMesStr = `${anoNum}-${String(mesNum).padStart(2, '0')}-${String(ultimoDiaMes).padStart(2, '0')}`;

        const agendamentosDoMes = await Agendamento.findAll({
            where: { data_agendamento: { [Op.between]: [inicioMesStr, fimMesStr] } },
            include: [{ model: Solicitacao, as: 'solicitacao', attributes: ['id', 'nome'] }],
            order: [['data_agendamento', 'ASC'], ['horario', 'ASC']]
        });
        const eventosPorDia = agendamentosDoMes.reduce((acc, ag) => {
            const data = ag.data_agendamento;
            const evento = { id: ag.id, time: ag.horario ? ag.horario.substring(0, 5) : 'N/A', text: ag.solicitacao?.nome || 'N/A', solicitacaoId: ag.solicitacao?.id };
            if (!acc[data]) acc[data] = [];
            acc[data].push(evento);
            return acc;
        }, {});
        res.json({ agendamentos: eventosPorDia });
    } catch (error) {
        console.error("[API CALENDAR CRITICAL]", error);
        res.status(500).json({ error: "Erro ao buscar disponibilidade" });
    }
});


// --- Middlewares de Tratamento de Erro (Finais) ---
app.use((req, res, next) => {
    console.warn(`[404 NOT FOUND] ${req.method} ${req.originalUrl}`);
    const errorPagePath = path.join(__dirname, 'views', '404.html'); // Tenta enviar 404.html
    if (fs.existsSync(errorPagePath)) {
        return res.status(404).sendFile(errorPagePath);
    }
    res.status(404).send("Página Não Encontrada"); // Fallback
});

app.use((err, req, res, next) => {
    console.error("[500 INTERNAL SERVER ERROR]", {
        message: err.message, name: err.name, status: err.status || 500,
        url: req.originalUrl, method: req.method, ip: req.ip,
        userId: req.session?.usuarioId || 'N/A', userType: req.session?.tipoUsuario || 'N/A'
        // stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
    const errorMessage = process.env.NODE_ENV === 'production' ? 'Erro inesperado.' : `Erro: ${err.message}`;
    if (req.originalUrl.startsWith('/api/')) {
         return res.status(err.status || 500).json({ error: "Erro interno.", details: errorMessage });
    }
    const errorPagePath = path.join(__dirname, 'views', '500.html'); // Tenta enviar 500.html
    if (fs.existsSync(errorPagePath)) {
        return res.status(500).sendFile(errorPagePath);
    }
    res.status(500).send(`Erro Interno no Servidor: ${errorMessage}`); // Fallback
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`---------------------------------------------------------`);
    console.log(`🚀 Servidor EDUCA MENTE rodando na porta ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`   Acesse em: http://localhost:${PORT}`);
    console.log(`---------------------------------------------------------`);
    sequelize.authenticate()
        .then(() => console.log('[DB CONNECT] Conexão com o banco de dados OK.'))
        .catch(dbErr => console.error('[DB CONNECT ERROR]', dbErr));
});