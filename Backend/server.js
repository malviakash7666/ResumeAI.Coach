import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import db from "./src/database/models/index.js";
import resumeRouter from "./src/modules/resume.routes.js";
import authRouter from "./src/routes/auth.routes.js";

dotenv.config();
console.log({
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY,
  secretExists: !!process.env.CLOUDINARY_API_SECRET,
});

const app = express();

/* ================= CORS ================= */

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      // Dynamically allow any localhost or loopback origin for local development
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin === "http://localhost" ||
        origin === "http://127.0.0.1"
      ) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ================= ROUTES ================= */

app.get("/", (req, res) => {
  res.send("API Running 🚀");
});

app.use("/auth", authRouter);
app.use("/", resumeRouter);

// Global Error Handler returning standardized error payload formats
app.use((err, req, res, next) => {
  console.error("⚠️ Global Error Handler:", err);
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "An unexpected error occurred.";
  const data = err.errors || null;

  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
});

/* ================= DB + SERVER START ================= */

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log("✅ Database connected");
    
    // Sync schemas automatically
    await db.sequelize.sync({ alter: true });
    console.log("✅ Database models synchronized");
  } catch (error) {
    console.warn("⚠️ Database connection failed. Proceeding in memory-only mode without database...");
    console.error(error.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();

/* ================= CLEAN EXIT ================= */

process.on("SIGINT", async () => {
  console.log("🟡 Shutting down...");

  try {
    await db.sequelize.close();
    console.log("🔴 DB disconnected");
  } catch (e) {
    // Ignore db close errors on clean exit
  }

  process.exit(0);
});
