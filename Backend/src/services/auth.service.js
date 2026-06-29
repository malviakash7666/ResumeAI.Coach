import db from "../database/models/index.js";
import passwordService from "./password.service.js";
import tokenService from "./token.service.js";
import ApiError from "../utils/ApiError.js";

const User = db.User;

class AuthService {
  async registerUser(name, email, password, role) {
    if (!name || !email || !password) {
      throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError(400, "User already exists with this email");
    }

    const hashedPassword = await passwordService.hashPassword(password);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user", // Registration is only for normal users. Admins are seeded.
    });

    const accessToken = tokenService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = tokenService.generateRefreshToken({ id: user.id });

    // Store refresh token inside database
    await user.update({ refreshToken });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        resumeUrl: user.resumeUrl,
        resumeAnalysis: user.resumeAnalysis,
        interviewHistory: user.interviewHistory,
      },
      accessToken,
      refreshToken,
    };
  }

  async loginUser(email, password) {
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new ApiError(400, "Invalid credentials");
    }

    const isMatch = await passwordService.verifyPassword(password, user.password);
    if (!isMatch) {
      throw new ApiError(400, "Invalid credentials");
    }

    const accessToken = tokenService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = tokenService.generateRefreshToken({ id: user.id });

    // Update login timestamps and refresh token
    await user.update({
      refreshToken,
      lastLogin: new Date(),
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        resumeUrl: user.resumeUrl,
        resumeAnalysis: user.resumeAnalysis,
        interviewHistory: user.interviewHistory,
      },
      accessToken,
      refreshToken,
    };
  }

  async logoutUser(userId) {
    const user = await User.findByPk(userId);
    if (user) {
      await user.update({ refreshToken: null });
    }
    return true;
  }

  async refreshUserToken(incomingRefreshToken) {
    if (!incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is missing");
    }

    let decoded;
    try {
      decoded = tokenService.verifyRefreshToken(incomingRefreshToken);
    } catch (e) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const accessToken = tokenService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = tokenService.generateRefreshToken({ id: user.id });

    // Update refresh token in database (token rotation)
    await user.update({ refreshToken: newRefreshToken });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getUserProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    return user;
  }
}

export default new AuthService();
