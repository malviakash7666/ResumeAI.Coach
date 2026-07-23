'use strict';

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jobs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      company: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      employmentType: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'Full Time',
      },
      country: {
        type: Sequelize.STRING,
        defaultValue: 'India',
      },
      workMode: {
        type: Sequelize.STRING,
        defaultValue: 'Hybrid',
      },
      experienceLevel: {
        type: Sequelize.STRING,
        defaultValue: '1-3 Years',
      },
      postedDate: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      skills: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      source: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sourceUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      applyUrl: {
        type: Sequelize.STRING,
        allowNull: false,
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
    await queryInterface.dropTable('jobs');
  },
};
