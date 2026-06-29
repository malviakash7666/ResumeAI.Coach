import express from "express";
import authController from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", protect, authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.get("/me", protect, authController.getMe);

export default router;
