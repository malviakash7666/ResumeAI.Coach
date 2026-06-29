import express from "express";
import {
  register,
  login,
  getMe,
  logout,
} from "./controllers/auth.controller.js";

import { protect } from "../middleware/user.middleware.js";

const router = express.Router();

/* =========================
   PUBLIC ROUTES
========================= */
router.post("/register", register);
router.post("/login", login);

/* =========================
   PROTECTED ROUTES
========================= */
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

export default router;