'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      password: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      role: {
        type: Sequelize.ENUM('user', 'admin'),
        defaultValue: 'user',
      },

      avatarUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      avatar: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      provider: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'local',
      },

      providerId: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      profileCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      updatedBy: {
        type: Sequelize.UUID,
        allowNull: true,
      },

      refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      resumeUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      resumeAnalysis: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      interviewHistory: {
        type: Sequelize.JSON,
        allowNull: true,
      },

      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      bio: {
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('users');

    // ENUM cleanup (important in Postgres)
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_role";'
    );
  },
};