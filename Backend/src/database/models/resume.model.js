import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Resume = sequelize.define(
    "Resume",
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

      fileName: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      resumeUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      resumeAnalysis: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "resumes",
      timestamps: true,
    }
  );

  Resume.associate = (db) => {
    Resume.belongsTo(db.User, { foreignKey: "userId", as: "user" });
    Resume.hasMany(db.Interview, { foreignKey: "resumeId", as: "interviews", onDelete: "CASCADE" });
  };

  return Resume;
};
