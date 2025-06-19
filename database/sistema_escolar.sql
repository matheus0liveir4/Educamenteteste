CREATE DATABASE sistema_escolar;
USE sistema_escolar;

-- Tabela para armazenar usuários genéricos
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('aluno', 'professor', 'psicopedagoga') NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE solicitacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    curso VARCHAR(100) NOT NULL,
    turno ENUM('Matutino', 'Vespertino', 'Noturno') NOT NULL,
    turma VARCHAR(20) NOT NULL,
    telefone VARCHAR(20),
    responsavel VARCHAR(100),
    instituicao VARCHAR(100),
    obser TEXT,
    email_aluno_contato VARCHAR(100),
    laudo BOOLEAN DEFAULT FALSE,
	imagem VARCHAR(255),
    status ENUM('Pendente', 'Agendado', 'Rejeitado', 'Finalizado') DEFAULT 'Pendente',
    observacao_rejeicao TEXT,
	modificado_por_usuario_id INT NULL, 
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
    FOREIGN KEY (modificado_por_usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitacoes_id INT NOT NULL,
    data_agendamento DATE NOT NULL,
    horario TIME NOT NULL,
    obser_agendamento TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (solicitacoes_id) REFERENCES Solicitacoes(id) 
);

CREATE TABLE observacoes (
  id SERIAL PRIMARY KEY,
  agendamentos_id INTEGER NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VALOR TESTE PARA ALUNO
insert into usuarios (nome, email, senha, tipo) 
values ("matheus", "matheus@gmail.com", 123456, 'aluno');

-- VALOR TESTE PARA PSICOPEDAGOGA
insert into usuarios (nome, email, senha, tipo) 
values ("Maria", "psico@teste.com", 123456, 'psicopedagoga');
insert into usuarios (nome, email, senha, tipo) 
values ("Ana", "ana@teste.com", 123456, 'psicopedagoga');

-- VALOR TESTE PARA PROFESSOR
insert into usuarios (nome, email, senha, tipo) 
values ("professor", "prof@teste.com", 123456, 'professor');


-- VALORES TESTES PARA SOLICITÇÕES
INSERT INTO solicitacoes (
    usuario_id, nome, data_nascimento, curso, turno, turma, telefone,
    responsavel, instituicao, obser, laudo
) VALUES (
    1, 'Ana Beatriz Silva', '2005-03-21', 'Psicologia', 'matutino', 'A1',
    '(11) 99999-9999', 'Maria Silva', 'SENAI Lauro de Freitas', 'Aluno com dificuldades de atenção', TRUE
);
INSERT INTO solicitacoes (
    usuario_id, nome, data_nascimento, curso, turno, turma, telefone,
    responsavel, instituicao, obser, laudo, status
) VALUES (
    1, 'João Pedro Martins', '2006-11-10', 'Engenharia Civil', 'noturno', 'C3',
    '(21) 98888-8888', 'Carlos Martins', 'SENAI CIMATEC', 'Solicitação urgente para acompanhamento', FALSE, 'Agendado'
);
INSERT INTO solicitacoes (
    usuario_id, nome, data_nascimento, curso, turno, turma, instituicao,
    obser, laudo, status
) VALUES (
    1, 'Larissa Oliveira', '2004-07-15', 'Pedagogia', 'vespertino', 'B2',
    'SENAI Camaçari', 'Aluno desistiu da solicitação', FALSE, 'Rejeitado'
);

-- VALOR TESTE PARA AGENDAMENTO
INSERT INTO agendamentos (
    id, solicitacoes_id, data_agendamento, horario, obser_agendamento
) VALUES (
    1, 2, '2025-05-12', '14:00', 'Aluno com dificuldades de leitura'
); 


SELECT * FROM usuarios;
SELECT * FROM solicitacoes;
SELECT * FROM agendamentos;
SELECT * FROM observacoes;
