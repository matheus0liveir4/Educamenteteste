// Conteúdo para o arquivo migrations/SEU_TIMESTAMP-create-observacoes-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('observacoes', { // Nome da tabela como no seu SQL
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      agendamentos_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'agendamentos', // Nome da tabela agendamentos
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      /*
      // COMENTADO POR ENQUANTO: Se você adicionar a coluna usuario_id na tabela observacoes no futuro
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // Ou false, dependendo da sua regra de negócio
        references: {
          model: 'Usuarios', // Nome da tabela Usuarios
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' // Ou CASCADE, ou RESTRICT
      },
      */
      texto: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      criado_em: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      atualizado_em: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') // Específico do MySQL
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('observacoes');
  }
};