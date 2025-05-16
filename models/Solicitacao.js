// Arquivo: models/Solicitacao.js (ou onde você define seus modelos Sequelize)

module.exports = (sequelize, DataTypes) => {
  const Solicitacao = sequelize.define('Solicitacao', {
    // Seus campos da tabela Solicitacoes
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    data_nascimento: {
      type: DataTypes.DATEONLY, // Apenas data, sem hora
      allowNull: false
    },
    curso: {
      type: DataTypes.STRING,
      allowNull: false
    },
    turno: {
      type: DataTypes.ENUM('Matutino', 'Vespertino', 'Noturno'),
      allowNull: false
    },
    turma: {
      type: DataTypes.STRING,
      allowNull: false
    },
    telefone: {
      type: DataTypes.STRING
    },
    responsavel: {
      type: DataTypes.STRING
    },
    instituicao: {
      type: DataTypes.STRING
    },
    obser: {
      type: DataTypes.TEXT
    },
    laudo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    imagem: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM('Pendente', 'Aprovado', 'Rejeitado', 'Finalizado', 'Agendado'),
      defaultValue: 'Pendente'
    },
    criado_em: {
      type: DataTypes.DATE,
      // O defaultValue: DataTypes.NOW pode ser redundante se seu DB
      // já tem DEFAULT CURRENT_TIMESTAMP para esta coluna.
      // Se o DB gerencia, pode remover o defaultValue daqui.
      // Se você quer que o Sequelize sempre insira um valor, pode manter.
      // No seu CREATE TABLE, você tem: criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      // Então, o defaultValue aqui pode ser omitido.
    }
  }, {
    tableName: 'Solicitacoes',
    timestamps: false // Isso está correto, pois você nomeou sua coluna 'criado_em'
                      // e não tem uma coluna para 'updatedAt' gerenciada pelo Sequelize com esse nome.
                      // Se você tivesse uma coluna 'atualizado_em' e quisesse que o Sequelize a gerenciasse,
                      // você usaria timestamps: true, createdAt: 'criado_em', updatedAt: 'atualizado_em'.
  });

  Solicitacao.associate = models => {
    // Associação com Usuario: Uma Solicitação pertence a um Usuário.
    // 'models.Usuario' é como você se refere ao modelo Usuario.
    // O alias 'usuario' (minúsculo) é como você acessará os dados do usuário
    // a partir de um objeto Solicitacao (ex: umaSolicitacao.usuario.email).
    Solicitacao.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id', // A chave estrangeira na tabela Solicitacoes que aponta para Usuarios.id
      as: 'usuario'             // Este alias DEVE corresponder ao 'as' usado na sua query de 'include'.
    });
    
    // Associação com Agendamento: Uma Solicitação pode ter muitos Agendamentos.
    Solicitacao.hasMany(models.Agendamento, {
      foreignKey: 'solicitacoes_id', // A chave estrangeira na tabela Agendamentos que aponta para Solicitacoes.id
      as: 'agendamentos'            // Alias para acessar os agendamentos de uma solicitação.
    });
  };

  return Solicitacao;
};