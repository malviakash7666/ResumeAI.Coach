import express from "express";
import multer from "multer";
import {
  uploadResume,
  analyzeResume,
  startInterview,
  chatInterview,
  endInterview,
  getUserResumes,
  getUserInterviews,
  getInterviewReport,
  deleteUserResume,
  deleteUserInterview,
} from "./resume.controller.js";
import { protect, optionalProtect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Multer setup: store in memory, limit to 5MB, accept only PDFs
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed!"), false);
    }
  },
});

router.post("/upload-resume", optionalProtect, upload.single("resume"), uploadResume);
router.post("/analyze-resume", optionalProtect, analyzeResume);
router.post("/start-interview", protect, startInterview);
router.post("/chat-interview", protect, chatInterview);
router.post("/end-interview", protect, endInterview);

router.get("/resumes", protect, getUserResumes);
router.delete("/resumes/:id", protect, deleteUserResume);
router.get("/interviews", protect, getUserInterviews);
router.get("/interviews/:id", protect, getInterviewReport);
router.delete("/interviews/:id", protect, deleteUserInterview);

export default router;
