module.exports = (sequelize, DataTypes) => {
  const Observacao = sequelize.define("Observacao", {
    id: { // Adicionando PK se não foi intencional omitir
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    texto: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    agendamentos_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { 
        model: 'agendamentos',
        key: 'id'
      }
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW 
    }
  }, {
    tableName: 'observacoes',
    timestamps: false
  });

  Observacao.associate = models => {
    Observacao.belongsTo(models.Agendamento, {
      foreignKey: "agendamentos_id",
      as: "agendamento"
    });
  };

  return Observacao;
};