// config/Database.js
const { Sequelize } = require('sequelize');

let sequelizeInstance; // Renomeado de 'db' para evitar confusão com o 'db' exportado de models/index.js

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  // Configuração para PRODUÇÃO (ex: Render com PlanetScale)
  console.log('[DB CONFIG] Usando configuração de PRODUÇÃO via DATABASE_URL.');
  sequelizeInstance = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    protocol: 'mysql', // Algumas plataformas podem precisar disso explicitamente com DATABASE_URL
    dialectOptions: {
      ssl: {
        require: true,
        // O PlanetScale geralmente funciona bem com rejectUnauthorized: false
        // Se você tiver problemas, pode ser necessário obter o CA deles e configurar aqui.
        rejectUnauthorized: false
      }
    },
    logging: false, // Opcional: desabilitar logs SQL do Sequelize em produção
    pool: { // Configurações de pool são boas para produção
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Configuração para DESENVOLVIMENTO LOCAL
  console.log('[DB CONFIG] Usando configuração de DESENVOLVIMENTO local.');
  sequelizeInstance = new Sequelize('sistema_escolar', 'root', '', { // Seu banco, usuário e senha local
    host: 'localhost',
    dialect: 'mysql',
    logging: console.log // Mostra logs SQL no console durante o desenvolvimento
  });
}

module.exports = sequelizeInstance; // Exporta a instância configurada