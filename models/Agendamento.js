module.exports = (sequelize, DataTypes) => {
  const Agendamento = sequelize.define('Agendamento', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    solicitacoes_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    data_agendamento: {
      type: DataTypes.DATEONLY, // apenas data (sem hora)
      allowNull: false
    },
    horario: {
      type: DataTypes.TIME, // representa o TIMESTAMP
      allowNull: false
    },
    obser_agendamento: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    tableName: 'agendamentos',
    timestamps: false
  });
  
  // Associação com Solicitacoes (opcional se quiser fazer no modelo)
  Agendamento.associate = (models) => {
    Agendamento.belongsTo(models.Solicitacao, {
      foreignKey: 'solicitacoes_id',
      as: 'solicitacao'
    });
    Agendamento.hasMany(models.Observacao, { 
      foreignKey: 'agendamentos_id', 
      as: 'observacoes' 
    }); 
  };  

  return Agendamento;
};
