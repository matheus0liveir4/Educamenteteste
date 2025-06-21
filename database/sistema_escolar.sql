CREATE DATABASE defaultdb;
USE defaultdb;

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
    FOREIGN KEY (solicitacoes_id) REFERENCES solicitacoes(id) 
);

CREATE TABLE observacoes (
  id SERIAL PRIMARY KEY,
  agendamentos_id INTEGER NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VALOR TESTE PARA PSICOPEDAGOGA
insert into usuarios (nome, email, senha, tipo) 
values ('psicopedagoga', 'tcceducamente@gmail.com', 'educamenteTCC', 'psicopedagoga');

-- VALOR TESTE PARA PROFESSOR
insert into usuarios (nome, email, senha, tipo) 
values ('professor', 'professor@teste.com', 'educamentePROFESSOR', 'professor');

SELECT * FROM usuarios;
SELECT * FROM solicitacoes;
SELECT * FROM agendamentos;
SELECT * FROM observacoes;
