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
      type: DataTypes.DATEONLY, 
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
      type: DataTypes.ENUM('Pendente', 'Agendado', 'Rejeitado', 'Finalizado'),
      defaultValue: 'Pendente'
    },
    criado_em: {
      type: DataTypes.DATE,
    }
  }, {
    tableName: 'Solicitacoes',
    timestamps: true, // HABILITA os timestamps
    createdAt: 'criado_em', // Mapeia createdAt para a coluna 'criado_em'
    updatedAt: 'atualizado_em' // Mapeia updatedAt para uma coluna 'atualizado_em' (VOCÊ PRECISA CRIAR ESSA COLUNA NO BANCO)
   });

  Solicitacao.associate = models => {
   
    // Associação com Usuario: 
    Solicitacao.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id', 
      as: 'usuario'             
    });
    
    // Associação com Agendamento: 
    Solicitacao.hasMany(models.Agendamento, {
      foreignKey: 'solicitacoes_id', 
      as: 'agendamentos'            
    });
  };

  return Solicitacao;
};