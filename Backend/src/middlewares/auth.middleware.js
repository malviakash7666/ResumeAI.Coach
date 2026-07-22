import tokenService from "../services/token.service.js";
import authService from "../services/auth.service.js";
import ApiError from "../utils/ApiError.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // Attempt 1: Verify Access Token
    if (token) {
      try {
        const decoded = tokenService.verifyAccessToken(token);
        req.user = decoded;
        return next();
      } catch (err) {
        // Access token expired/invalid - fall back to silent refresh token
      }
    }

    // Attempt 2: Silent Refresh using Refresh Token cookie if present
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (incomingRefreshToken) {
      try {
        const { accessToken, refreshToken } = await authService.refreshUserToken(incomingRefreshToken);
        const decoded = tokenService.verifyAccessToken(accessToken);
        req.user = decoded;

        // Set fresh cookies on response
        res.cookie("accessToken", accessToken, {
          ...cookieOptions,
          maxAge: ACCESS_TOKEN_MAX_AGE,
        });
        res.cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        });

        return next();
      } catch (rfErr) {
        throw new ApiError(401, "Session expired. Please log in again.");
      }
    }

    throw new ApiError(401, "Authentication required. Please log in first.");
  } catch (error) {
    next(error);
  }
};

export const optionalProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = tokenService.verifyAccessToken(token);
        req.user = decoded;
        return next();
      } catch (err) {
        // Suppress invalid access token
      }
    }

    const incomingRefreshToken = req.cookies?.refreshToken;
    if (incomingRefreshToken) {
      try {
        const { accessToken, refreshToken } = await authService.refreshUserToken(incomingRefreshToken);
        const decoded = tokenService.verifyAccessToken(accessToken);
        req.user = decoded;

        res.cookie("accessToken", accessToken, {
          ...cookieOptions,
          maxAge: ACCESS_TOKEN_MAX_AGE,
        });
        res.cookie("refreshToken", refreshToken, {
          ...cookieOptions,
          maxAge: REFRESH_TOKEN_MAX_AGE,
        });
      } catch (rfErr) {
        // Ignore refresh errors in optional protect
      }
    }

    next();
  } catch (error) {
    next();
  }
};
