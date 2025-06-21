const { Sequelize } = require('sequelize');

// Conexão com o banco de dados
const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false,
      ca: process.env.DB_CA_CERT ? Buffer.from(process.env.DB_CA_CERT, 'base64').toString('utf-8') : undefined,
    }
  },
  logging: false,
});

module.exports = db;