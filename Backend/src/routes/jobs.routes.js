import express from "express";
import {
  getRecommendedJobs,
  getCandidateProfile,
  updateCandidateProfile,
  syncJobsManual,
  clearFetchedJobs,
  getJobSourceDetails,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getJobFetchSettings,
  updateJobFetchSettings,
} from "../controllers/jobs.controller.js";
import { protect, optionalProtect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/recommended", optionalProtect, getRecommendedJobs);
router.get("/profile", protect, getCandidateProfile);
router.put("/profile", protect, updateCandidateProfile);
router.post("/sync", protect, syncJobsManual);
router.delete("/clear", protect, clearFetchedJobs);
router.get("/fetch-settings", optionalProtect, getJobFetchSettings);
router.put("/fetch-settings", optionalProtect, updateJobFetchSettings);

// Saved Jobs Endpoints
router.get("/saved", protect, getSavedJobs);
router.post("/saved", protect, saveJob);
router.delete("/saved/:jobId", protect, unsaveJob);

router.get("/:id/source", optionalProtect, getJobSourceDetails);

export default router;
