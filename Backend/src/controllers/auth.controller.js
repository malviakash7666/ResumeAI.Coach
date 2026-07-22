import authService from "../services/auth.service.js";
import socialAuthService from "../services/socialAuth.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import db from "../database/models/index.js";
import passwordService from "../services/password.service.js";

// Cookie options: HttpOnly, secure in production, lax sameSite
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

class AuthController {
  register = async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const { user, accessToken, refreshToken } = await authService.registerUser(
        name,
        email,
        password,
        role
      );

      return res
        .status(201)
        .cookie("accessToken", accessToken, {
          ...cookieOptions,
          maxAge: ACCESS_TOKEN_MAX_AGE,
        })
        .cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        })
        .json(new ApiResponse(201, { user, accessToken, refreshToken }, "User registered successfully"));
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

      return res
        .status(200)
        .cookie("accessToken", accessToken, {
          ...cookieOptions,
          maxAge: ACCESS_TOKEN_MAX_AGE,
        })
        .cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        })
        .json(new ApiResponse(200, { user, accessToken, refreshToken }, "Login successful"));
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      if (req.user && req.user.id) {
        await authService.logoutUser(req.user.id);
      }

      return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req, res, next) => {
    try {
      const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is missing");
      }

      const { accessToken, refreshToken } = await authService.refreshUserToken(incomingRefreshToken);

      return res
        .status(200)
        .cookie("accessToken", accessToken, {
          ...cookieOptions,
          maxAge: ACCESS_TOKEN_MAX_AGE,
        })
        .cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        })
        .json(new ApiResponse(200, { accessToken, refreshToken }, "Token refreshed successfully"));
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req, res, next) => {
    try {
      const user = await authService.getUserProfile(req.user.id);
      return res
        .status(200)
        .json(new ApiResponse(200, { user }, "User profile retrieved successfully"));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req, res, next) => {
    try {
      const { name, phone, bio } = req.body;
      const user = await db.User.findByPk(req.user.id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      await user.update({ name, phone, bio });
      const updatedUser = await authService.getUserProfile(req.user.id);
      return res.status(200).json(new ApiResponse(200, { user: updatedUser }, "Profile updated successfully"));
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await db.User.findByPk(req.user.id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      const isMatch = await passwordService.verifyPassword(currentPassword, user.password);
      if (!isMatch) {
        throw new ApiError(400, "Current password does not match");
      }

      const hashedPassword = await passwordService.hashPassword(newPassword);
      await user.update({ password: hashedPassword });
      return res.status(200).json(new ApiResponse(200, {}, "Password updated successfully"));
    } catch (error) {
      next(error);
    }
  };

  githubRedirect = (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID || "";
    const redirectUri = encodeURIComponent(process.env.GITHUB_REDIRECT_URI || "http://localhost:5000/auth/github/callback");
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
    return res.redirect(githubUrl);
  };

  githubCallback = async (req, res, next) => {
    try {
      const { code } = req.query;
      if (!code) {
        throw new ApiError(400, "Authorization code is missing");
      }

      const { user, accessToken, refreshToken } = await socialAuthService.handleGithubLogin(code);

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      
      return res
        .cookie("accessToken", accessToken, {
          ...cookieOptions,
          maxAge: ACCESS_TOKEN_MAX_AGE,
        })
        .cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        })
        .redirect(`${frontendUrl}/login?token=${accessToken}&refreshToken=${refreshToken}`);
    } catch (error) {
      console.error("GitHub callback controller error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message || "GitHub Authentication Failed")}`);
    }
  };

  googleLogin = async (req, res, next) => {
    try {
      const { idToken } = req.body;
      const { user, accessToken, refreshToken } = await socialAuthService.handleGoogleLogin(idToken);

      return res
        .status(200)
        .cookie("accessToken", accessToken, {
          ...cookieOptions,
          maxAge: ACCESS_TOKEN_MAX_AGE,
        })
        .cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        })
        .json(new ApiResponse(200, { user, accessToken, refreshToken }, "Google login successful"));
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();
