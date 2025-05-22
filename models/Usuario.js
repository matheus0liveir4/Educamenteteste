module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('aluno', 'professor', 'psicopedagoga'),
      allowNull: false
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Usuarios',
    timestamps: false 
  });

  // Defina o método de associação AQUI
  Usuario.associate = function(models) {
    Usuario.hasMany(models.Solicitacao, {
      foreignKey: 'usuario_id',
      as: 'solicitacoes'
    });
  };

  return Usuario;
};