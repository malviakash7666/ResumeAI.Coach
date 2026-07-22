import { DataTypes } from "sequelize";

export default (sequelize) => {
  const JobFetchSettings = sequelize.define(
    "JobFetchSettings",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fetchFrequency: {
        type: DataTypes.STRING,
        defaultValue: "Every 6 hours",
      },
      maxJobsPerRun: {
        type: DataTypes.INTEGER,
        defaultValue: 500,
      },
      lastRun: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      nextRun: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "Active",
      },
    },
    {
      tableName: "job_fetch_settings",
      timestamps: true,
    }
  );

  return JobFetchSettings;
};
