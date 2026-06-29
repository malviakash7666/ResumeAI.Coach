import fs from "fs";
import path from "path";
import Sequelize from "sequelize";
import process from "process";
import { fileURLToPath } from "url";
import config from "../config/config.js";
import { pathToFileURL } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";

const dbConfig = config[env];

const db = {};

let sequelize;

if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

/* =========================
   LOAD ONLY .model.js FILES
========================= */

const files = fs.readdirSync(__dirname).filter((file) => {
  return (
    file.indexOf(".") !== 0 &&
    file !== basename &&
    file.endsWith(".model.js") &&
    !file.includes(".test.js")
  );
});

/* =========================
   IMPORT MODELS (ESM DYNAMIC IMPORT)
========================= */

for (const file of files) {
  const filePath = path.join(__dirname, file);

  const modelModule = await import(pathToFileURL(filePath).href);

  const model = modelModule.default(sequelize, Sequelize.DataTypes);

  db[model.name] = model;
}

/* =========================
   ASSOCIATIONS
========================= */

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;