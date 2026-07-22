import express from "express";
import authController from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", protect, authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.get("/me", protect, authController.getMe);
router.put("/profile", protect, authController.updateProfile);
router.put("/change-password", protect, authController.changePassword);

// Social authentication routes
router.get("/github", authController.githubRedirect);
router.get("/github/callback", authController.githubCallback);
router.post("/google", authController.googleLogin);

export default router;
