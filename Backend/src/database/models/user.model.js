// user.model.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      role: {
        type: DataTypes.ENUM("user", "admin"),
        defaultValue: "user",
      },

      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      profileCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      resumeUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      resumeAnalysis: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      interviewHistory: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
    }
  );

  User.associate = (db) => {
    // Example relations (future use)
    // User.hasMany(db.Resume, { foreignKey: "userId" });
    // User.hasMany(db.Batch, { foreignKey: "createdBy" });
  };

  return User;
};