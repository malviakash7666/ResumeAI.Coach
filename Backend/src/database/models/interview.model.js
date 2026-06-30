import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Interview = sequelize.define(
    "Interview",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      resumeId: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      fileName: {
        type: DataTypes.STRING,
        allowNull: true,
      },

      mode: {
        type: DataTypes.ENUM("text", "voice"),
        allowNull: false,
        defaultValue: "text",
      },

      chatHistory: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      scores: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      finalReport: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      overallScore: {
        type: DataTypes.DECIMAL(3, 1),
        allowNull: true,
      },
    },
    {
      tableName: "interviews",
      timestamps: true,
    }
  );

  Interview.associate = (db) => {
    Interview.belongsTo(db.User, { foreignKey: "userId", as: "user" });
    Interview.belongsTo(db.Resume, { foreignKey: "resumeId", as: "resume" });
  };

  return Interview;
};
