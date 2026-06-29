'use strict';
import bcrypt from 'bcryptjs';

export default {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('AdminPassword123', 10);
    
    // Insert a default admin user
    await queryInterface.bulkInsert('users', [
      {
        id: '99999999-9999-9999-9999-999999999999',
        name: 'System Admin',
        email: 'admin@resumeai.coach',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
        profileCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { role: 'admin' }, {});
  }
};
