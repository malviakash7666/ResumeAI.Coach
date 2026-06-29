import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../database/models/index.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.js";

/* =========================
   COOKIE OPTIONS
========================= */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/* =========================
   REGISTER USER
========================= */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
    });

    return res
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 min
      })
      .cookie("refreshToken", refreshToken, cookieOptions)
      .status(201)
      .json({
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   LOGIN USER
========================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
    });

    await user.update({
      lastLogin: new Date(),
    });

    return res
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET ME (AUTO LOGIN CHECK)
   -> cookie se user identify
========================= */
export const getMe = async (req, res) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user,
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* =========================
   LOGOUT
========================= */
export const logout = (req, res) => {
  return res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json({ message: "Logged out successfully" });
};