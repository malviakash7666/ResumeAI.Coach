import express from "express";
import {
  getUserApplications,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
} from "../controllers/applications.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getUserApplications);
router.post("/", protect, createApplication);
router.patch("/:id", protect, updateApplicationStatus);
router.delete("/:id", protect, deleteApplication);

export default router;
