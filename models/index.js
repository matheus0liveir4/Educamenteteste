<<<<<<< HEAD
// models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelizeInstance = require('../config/Database'); // Importa a instância configurada do Database.js

const db = {};

// Carrega cada arquivo de modelo dinamicamente
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelizeInstance, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Aplica as associações se os modelos tiverem um método 'associate'
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// --- DEFINIÇÃO EXPLÍCITA DAS ASSOCIAÇÕES ---
// (Você pode usar este método, ou o método 'associate' dentro de cada arquivo de modelo, ou uma combinação)

// Usuário pode ter várias Solicitações
if (db.Usuario && db.Solicitacao) {
  db.Usuario.hasMany(db.Solicitacao, {
    foreignKey: 'usuario_id',
    as: 'solicitacoes'
  });
  db.Solicitacao.belongsTo(db.Usuario, {
    foreignKey: 'usuario_id',
    as: 'usuario'
  });
}

// Solicitação pode ter vários Agendamentos
if (db.Solicitacao && db.Agendamento) {
  db.Solicitacao.hasMany(db.Agendamento, {
    foreignKey: 'solicitacoes_id',
    as: 'agendamentos'
  });
  db.Agendamento.belongsTo(db.Solicitacao, {
    foreignKey: 'solicitacoes_id',
    as: 'solicitacao'
  });
}

// Agendamento pode ter várias Observações
if (db.Agendamento && db.Observacao) {
  db.Agendamento.hasMany(db.Observacao, {
    foreignKey: 'agendamentos_id',
    as: 'observacoes'
  });
  db.Observacao.belongsTo(db.Agendamento, {
    foreignKey: 'agendamentos_id',
    as: 'agendamento'
  });
}

/*
// Usuário (psicopedagoga) pode ter feito várias Observações
// COMENTADO POR ENQUANTO, pois a coluna 'usuario_id' não existe na tabela 'observacoes' no schema atual.
// Para habilitar, adicione 'usuario_id' à tabela 'observacoes' e ao modelo 'Observacao.js'.
if (db.Usuario && db.Observacao) {
  db.Usuario.hasMany(db.Observacao, {
    foreignKey: 'usuario_id', // Presume que existe uma coluna 'usuario_id' em 'Observacao'
    as: 'observacoes_criadas'
  });
  db.Observacao.belongsTo(db.Usuario, {
    foreignKey: 'usuario_id', // Presume que existe uma coluna 'usuario_id' em 'Observacao'
    as: 'criador'
  });
}
*/
// --- FIM DA DEFINIÇÃO EXPLÍCITA DAS ASSOCIAÇÕES ---


db.sequelize = sequelizeInstance; // A instância do Sequelize conectada
db.Sequelize = Sequelize;         // A classe Sequelize (para DataTypes, Op, etc.)

module.exports = db;
=======
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

>>>>>>> 94a95285ce6d51749f1cd61be8e52523fd590c6b
