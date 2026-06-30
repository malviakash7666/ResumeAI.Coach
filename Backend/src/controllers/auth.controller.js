import authService from "../services/auth.service.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import db from "../database/models/index.js";
import passwordService from "../services/password.service.js";

// Cookie options: HttpOnly, secure in production, lax sameSite
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

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
        .cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .json(new ApiResponse(201, { user, accessToken }, "User registered successfully"));
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
        .cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .json(new ApiResponse(200, { user, accessToken }, "Login successful"));
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      // req.user is attached by the authenticate middleware
      if (req.user && req.user.id) {
        await authService.logoutUser(req.user.id);
      }

      return res
        .status(200)
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
        .cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .json(new ApiResponse(200, { accessToken }, "Token refreshed successfully"));
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req, res, next) => {
    try {
      // req.user is already populated by authenticating middleware
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
}

export default new AuthController();
