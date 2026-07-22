import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Application = sequelize.define(
    "Application",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      jobId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "jobs",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("Saved", "Applied", "Interview", "Rejected", "Offer"),
        defaultValue: "Applied",
      },
      appliedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "applications",
      timestamps: true,
    }
  );

  Application.associate = (db) => {
    Application.belongsTo(db.User, { foreignKey: "userId", as: "user" });
    Application.belongsTo(db.Job, { foreignKey: "jobId", as: "job" });
  };

  return Application;
};
