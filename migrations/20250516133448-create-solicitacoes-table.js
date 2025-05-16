// Conteúdo para o arquivo migrations/SEU_TIMESTAMP-create-solicitacoes-table.js
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Solicitacoes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios', // Nome da tabela Usuarios
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nome: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      data_nascimento: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      curso: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      turno: {
        type: Sequelize.ENUM('Matutino', 'Vespertino', 'Noturno'),
        allowNull: false
      },
      turma: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      telefone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      responsavel: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      instituicao: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      obser: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      laudo: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      imagem: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Pendente', 'Aprovado', 'Agendado', 'Rejeitado', 'Finalizado'),
        defaultValue: 'Pendente'
      },
      criado_em: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Solicitacoes');
  }
};