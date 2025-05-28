const { Sequelize } = require('sequelize');

// Conexão com o banco de dados
const db = new Sequelize('sistema_escolar', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = db;