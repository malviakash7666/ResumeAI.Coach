import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Job = sequelize.define(
    "Job",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      company: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING,
        defaultValue: "India",
      },
      workMode: {
        type: DataTypes.STRING, // "Remote / WFH" | "Hybrid" | "Onsite"
        defaultValue: "Hybrid",
      },
      employmentType: {
        type: DataTypes.STRING, // "Full Time" | "Internship" | "Part Time" | "Contract"
        defaultValue: "Full Time",
      },
      experienceLevel: {
        type: DataTypes.STRING, // "Internship" | "Entry Level" | "0-1 Years" | "1-3 Years" | "3+ Years"
        defaultValue: "1-3 Years",
      },
      skills: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      source: {
        type: DataTypes.STRING, // "Company Career Page" | "Greenhouse" | "Lever" | "Ashby" | "Workable"
        allowNull: false,
      },
      sourceUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      applyUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "jobs",
      timestamps: true,
      indexes: [
        { fields: ["country"] },
        { fields: ["workMode"] },
        { fields: ["source"] },
        { fields: ["employmentType"] },
        { fields: ["experienceLevel"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  Job.associate = (db) => {
    Job.hasMany(db.Application, { foreignKey: "jobId", as: "applications", onDelete: "CASCADE" });
    Job.hasMany(db.SavedJob, { foreignKey: "jobId", as: "savedByUsers", onDelete: "CASCADE" });
  };

  return Job;
};
