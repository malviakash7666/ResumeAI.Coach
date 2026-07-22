import { DataTypes } from "sequelize";

export default (sequelize) => {
  const SavedJob = sequelize.define(
    "SavedJob",
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
    },
    {
      tableName: "saved_jobs",
      timestamps: true,
    }
  );

  SavedJob.associate = (db) => {
    SavedJob.belongsTo(db.User, { foreignKey: "userId", as: "user" });
    SavedJob.belongsTo(db.Job, { foreignKey: "jobId", as: "job" });
  };

  return SavedJob;
};
