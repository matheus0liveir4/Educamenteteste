// Conteúdo para o arquivo migrations/SEU_TIMESTAMP-create-agendamentos-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('agendamentos', { // Nome da tabela como no seu SQL
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      solicitacoes_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Solicitacoes', // Nome da tabela Solicitacoes
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      data_agendamento: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      horario: {
        type: Sequelize.TIME,
        allowNull: false
      },
      obser_agendamento: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      criado_em: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('agendamentos');
  }
};