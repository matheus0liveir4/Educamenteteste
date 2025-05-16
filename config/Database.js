<<<<<<< HEAD
// config/Database.js
const { Sequelize } = require('sequelize');
// Não precisamos do 'fs' aqui se o CA vier de uma variável de ambiente
// const fs = require('fs'); 
// const path = require('path'); // Também não precisamos de path para este método

let sequelizeInstance;

if (process.env.NODE_ENV === 'production') {
  console.log('[DB CONFIG] Usando configuração de PRODUÇÃO.');

  const dbUrl = process.env.DATABASE_URL;
  const dbSslCa = process.env.DB_SSL_CA; // Nova variável para o conteúdo do CA

  if (!dbUrl) {
    console.error('[DB CONFIG ERROR] DATABASE_URL para produção não está definida!');
    process.exit(1); // Sair se a DATABASE_URL não estiver definida em produção
  }

  const dialectOptions = {
    ssl: {
      require: true, // Sempre requerer SSL para TiDB Cloud
      // Se DB_SSL_CA for fornecido, usamos para validar o certificado do servidor.
      // Se não, tentamos com rejectUnauthorized: false (menos seguro, mas pode funcionar se TiDB permitir).
      rejectUnauthorized: dbSslCa ? true : false, 
      ca: dbSslCa ? dbSslCa : undefined // Passa o conteúdo do CA se existir
    }
  };

  sequelizeInstance = new Sequelize(dbUrl, {
    dialect: 'mysql',
    protocol: 'mysql',
    dialectOptions: dialectOptions,
    logging: false, // Desabilitar logs SQL em produção
    pool: {
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
    logging: console.log // ou false, se preferir
  });
}

module.exports = sequelizeInstance;
=======
const { Sequelize } = require('sequelize');

// Conexão com o banco de dados
const db = new Sequelize('sistema_escolar', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = db;
>>>>>>> 94a95285ce6d51749f1cd61be8e52523fd590c6b
