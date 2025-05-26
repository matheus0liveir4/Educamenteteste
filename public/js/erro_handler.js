document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tipoErro = urlParams.get('tipo');
    const emailParam = urlParams.get('email');
    const contextoLogin = urlParams.get('contextoLogin'); // Novo parâmetro para o tipo de usuário no login

    const titleElement = document.querySelector('title');
    const h1Element = document.getElementById('errorTitle');
    const messageElement = document.getElementById('errorMessage');
    const actionButton = document.getElementById('errorActionButton');
    const homeLinkContainer = document.getElementById('homeLinkContainer');

    const h1OriginalClasses = 'error-page-title';

    // Resetar para o padrão
    h1Element.className = h1OriginalClasses;
    h1Element.style.fontFamily = '';
    actionButton.onclick = null;
    actionButton.style.display = 'inline-block';
    homeLinkContainer.style.display = 'block';

    // Função auxiliar para obter o nome do tipo de usuário formatado e o caminho do login
    function getLoginContextDetails(contexto) {
        switch (contexto) {
            case 'aluno':
                return { nomeFormatado: 'Aluno(a)', path: '/login?tipo=aluno' };
            case 'professor':
                return { nomeFormatado: 'Professor(a)', path: '/login?tipo=professor' };
            case 'psicopedagoga':
                return { nomeFormatado: 'Psicopedagoga', path: '/login?tipo=psicopedagoga' };
            default:
                return { nomeFormatado: 'Usuário', path: '/login' }; // Fallback genérico
        }
    }

    let loginDetails = {};
    if (contextoLogin) {
        loginDetails = getLoginContextDetails(contextoLogin);
    }

    switch (tipoErro) {
        // --- ERROS DE CADASTRO ---
        case 'cadastro_campos_obrigatorios':
            titleElement.textContent = 'Campos Obrigatórios - Cadastro';
            h1Element.textContent = 'Campos Obrigatórios';
            messageElement.innerHTML = `
                Por favor, preencha todos os campos obrigatórios (<strong>nome</strong>, <strong>e-mail</strong> e <strong>senha</strong>) para concluir seu cadastro.
            `;
            actionButton.textContent = 'Tentar Cadastro Novamente';
            actionButton.href = '/cadastro';
            break;

        case 'cadastro_email_existente':
            titleElement.textContent = 'E-mail já Cadastrado - Educa Mente';
            h1Element.textContent = 'E-mail já Cadastrado';
            h1Element.classList.add('audiowide-font');
            messageElement.innerHTML = `
                O e-mail fornecido ${emailParam ? `(<strong>${decodeURIComponent(emailParam)}</strong>)` : ''} já está associado a uma conta em nosso sistema.
                Se você já possui uma conta, por favor, <a href="/login?tipo=aluno" style="font-weight:bold; color: #0A4275; text-decoration: underline;">faça login</a>.
                Caso contrário, utilize outro e-mail para se cadastrar.
            `;
            actionButton.textContent = 'Tentar Cadastro Novamente';
            actionButton.href = '/cadastro';
            break;

        // --- ERROS DE LOGIN: CAMPOS OBRIGATÓRIOS ---
        case 'login_campos_obrigatorios':
            titleElement.textContent = 'Campos Obrigatórios - Login';
            h1Element.textContent = 'Campos Obrigatórios';
            messageElement.innerHTML = `
                Por favor, preencha os campos de <strong>e-mail</strong> e <strong>senha</strong> para fazer o login.
            `;
            actionButton.textContent = 'Voltar e Preencher';
            actionButton.href = '#';
            actionButton.onclick = (e) => {
                e.preventDefault();
                window.history.back();
                return false;
            };
            break;

        // --- ERRO DE LOGIN: USUÁRIO NÃO ENCONTRADO (UNIFICADO) ---
        case 'login_usuario_nao_encontrado':
            titleElement.textContent = `Erro - Login ${loginDetails.nomeFormatado || 'Usuário'}`;
            h1Element.textContent = 'Usuário não encontrado';
            h1Element.classList.add('audiowide-font');
            messageElement.innerHTML = `
                O e-mail ou senha que você inseriu não correspondem a uma conta de ${loginDetails.nomeFormatado || 'usuário cadastrado'}.
                Por favor, verifique suas credenciais e tente novamente.
            `;
            actionButton.textContent = 'Tentar Novamente';
            actionButton.href = loginDetails.path || '/login';
            break;

        // --- ERRO DE LOGIN: SENHA INCORRETA (UNIFICADO) ---
        case 'login_senha_incorreta':
            titleElement.textContent = `Senha Incorreta - ${loginDetails.nomeFormatado || 'Usuário'}`;
            h1Element.textContent = 'Senha Incorreta';
            messageElement.innerHTML = `
                A senha inserida para a conta de <strong>${loginDetails.nomeFormatado || 'usuário'}</strong> está incorreta.
                Por favor, verifique e tente novamente.
            `;
            actionButton.textContent = `Tentar Novamente (${loginDetails.nomeFormatado || 'Login'})`;
            actionButton.href = loginDetails.path || '/login';
            break;

        // --- ERRO DE LOGIN: TIPO DE CONTA INCORRETO ---
        case 'login_tipo_incorreto':
            const userTypeName = decodeURIComponent(urlParams.get('userTypeName') || 'Desconhecido');
            const attemptedLoginArea = decodeURIComponent(urlParams.get('attemptedArea') || 'Desconhecida');
            const correctLoginPage = decodeURIComponent(urlParams.get('correctLoginPath') || '/');
            const userEmail = decodeURIComponent(urlParams.get('userEmail') || 'O e-mail fornecido');

            titleElement.textContent = 'Acesso Negado - Educa Mente';
            h1Element.textContent = 'Acesso Negado';
            h1Element.classList.add('audiowide-font');
            messageElement.innerHTML = `
                A conta associada ao e-mail <strong>${userEmail}</strong> é do tipo <strong>${userTypeName}</strong>.<br>
                Você tentou fazer login na área de <strong>${attemptedLoginArea}</strong>.
                <br><br>
                Por favor, utilize o <a href="${correctLoginPage}" style="font-weight:bold; color: #1575A3; text-decoration: underline;">Login correto aqui</a>.
            `;
            actionButton.textContent = `Ir para Login ${userTypeName}`;
            actionButton.href = correctLoginPage;
            break;

        // --- Outros erros genéricos ---
        case 'erro_interno':
            titleElement.textContent = 'Erro Interno - Educa Mente';
            h1Element.textContent = 'Erro Interno no Servidor';
            messageElement.textContent = 'Ocorreu um problema inesperado em nossos servidores. Nossa equipe já foi notificada. Por favor, tente novamente mais tarde.';
            actionButton.textContent = 'Voltar para a Página Inicial';
            actionButton.href = '/';
            break;
        case 'nao_autorizado':
            titleElement.textContent = 'Acesso Não Autorizado - Educa Mente';
            h1Element.textContent = 'Acesso Não Autorizado';
            messageElement.textContent = 'Você não tem permissão para acessar este recurso ou realizar esta ação.';
            actionButton.textContent = 'Voltar para a Página Inicial';
            actionButton.href = '/';
            break;
        case 'nao_encontrado':
            titleElement.textContent = 'Página Não Encontrada - Educa Mente';
            h1Element.textContent = 'Página Não Encontrada (Erro 404)';
            messageElement.textContent = 'O recurso que você está procurando não existe ou foi movido.';
            actionButton.textContent = 'Voltar para a Página Inicial';
            actionButton.href = '/';
            break;
        default:
            titleElement.textContent = 'Erro Desconhecido - Educa Mente';
            h1Element.textContent = 'Ocorreu um Erro';
            messageElement.textContent = 'Algo inesperado aconteceu. Por favor, tente novamente ou contate o suporte se o problema persistir.';
            actionButton.textContent = 'Voltar para a Página Inicial';
            actionButton.href = '/';
            break;
    }
});