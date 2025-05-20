const { Sequelize } = require('sequelize');

// Conexão com o banco de dados
const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
       ca: fs.readFileSync(path.join(__dirname, 'certs/ca.pem'))
    }
  },
  logging: false,
});

module.exports = db;