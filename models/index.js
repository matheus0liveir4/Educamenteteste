const db = {};

const Sequelize = require('sequelize');
const sequelize = require('../config/Database');

const Usuario = require('./Usuario')(sequelize, Sequelize.DataTypes);
const Solicitacao = require('./Solicitacao')(sequelize, Sequelize.DataTypes);
const Agendamento = require('./Agendamento')(sequelize, Sequelize.DataTypes);
const Observacao = require('./Observacao')(sequelize, Sequelize.DataTypes);

// Salva os modelos no db antes de associar
db.Usuario = Usuario;
db.Solicitacao = Solicitacao;
db.Agendamento = Agendamento;
db.Observacao = Observacao;

// Associações
db.Usuario.hasMany(db.Solicitacao, { foreignKey: 'usuario_id' });
db.Solicitacao.belongsTo(db.Usuario, { foreignKey: 'usuario_id' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

Object.values(db).forEach(model => {
  if (model.associate) model.associate(db);
});

