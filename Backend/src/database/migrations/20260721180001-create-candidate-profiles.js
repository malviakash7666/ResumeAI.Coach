'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('candidate_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      skills: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      experience: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      education: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      preferredRoles: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      preferredLocation: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      github: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      linkedin: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('candidate_profiles');
  },
};
