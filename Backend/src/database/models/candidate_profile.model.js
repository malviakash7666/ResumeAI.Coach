import { DataTypes } from "sequelize";

export default (sequelize) => {
  const CandidateProfile = sequelize.define(
    "CandidateProfile",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      skills: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      experience: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      education: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      preferredRoles: {
        type: DataTypes.JSON,
        defaultValue: [],
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      preferredLocation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      github: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      linkedin: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "candidate_profiles",
      timestamps: true,
    }
  );

  CandidateProfile.associate = (db) => {
    CandidateProfile.belongsTo(db.User, { foreignKey: "userId", as: "user" });
  };

  return CandidateProfile;
};
