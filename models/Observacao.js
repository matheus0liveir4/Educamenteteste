module.exports = (sequelize, DataTypes) => {
  const Observacao = sequelize.define("Observacao", {
    texto: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    agendamentos_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    criado_em: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'observacoes',
    timestamps: false // 👈 impede que o Sequelize procure createdAt/updatedAt
  });

  Observacao.associate = models => {
    Observacao.belongsTo(models.Agendamento, {
      foreignKey: "agendamentos_id",
      as: "agendamento"
    });
  };

  return Observacao;
};