// models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelizeInstance = require('../config/Database'); // Importa a instância configurada do Database.js

const db = {};

// Carrega cada arquivo de modelo dinamicamente
// Esta parte é comum se você usou sequelize-cli para gerar modelos,
// mas também funciona se você criou os arquivos manualmente e eles exportam
// uma função que recebe (sequelize, DataTypes)
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) && // Não carregar este próprio arquivo (index.js)
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1 // Não carregar arquivos de teste
    );
  })
  .forEach(file => {
    // Para cada arquivo de modelo, requer e inicializa o modelo
    // passando a instância do sequelize e Sequelize.DataTypes
    const model = require(path.join(__dirname, file))(sequelizeInstance, Sequelize.DataTypes);
    db[model.name] = model; // Adiciona o modelo ao objeto db, usando o nome do modelo como chave
  });

// Aplica as associações se os modelos tiverem um método 'associate'
// Esta é a maneira preferida se seus arquivos de modelo (Usuario.js, etc.) definem 'static associate(models)'
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Se você NÃO tiver o método 'associate' em cada arquivo de modelo individual,
// você pode definir as associações explicitamente aqui.
// Certifique-se de que os nomes dos modelos (db.Usuario, db.Solicitacao) estão corretos.
// E que os apelidos (as:) correspondem ao que você usa nas suas queries.

/*
// Exemplo de como definir associações aqui se não estiverem nos modelos individuais:
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

// Associação Usuario <-> Observacao (quem criou) - COMENTADA
// if (db.Usuario && db.Observacao) {
//   db.Usuario.hasMany(db.Observacao, {
//     foreignKey: 'usuario_id',
//     as: 'observacoes_criadas'
//   });
//   db.Observacao.belongsTo(db.Usuario, {
//     foreignKey: 'usuario_id',
//     as: 'criador'
//   });
// }
*/

db.sequelize = sequelizeInstance; // A instância do Sequelize conectada
db.Sequelize = Sequelize;         // A classe Sequelize (para DataTypes, Op, etc.)

module.exports = db;