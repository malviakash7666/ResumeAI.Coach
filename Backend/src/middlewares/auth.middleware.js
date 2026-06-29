import tokenService from "../services/token.service.js";
import ApiError from "../utils/ApiError.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new ApiError(401, "Authentication required. Please log in first.");
    }

    try {
      const decoded = tokenService.verifyAccessToken(token);
      req.user = decoded; // Attach { id, email, role } to request
      next();
    } catch (err) {
      throw new ApiError(401, "Invalid or expired access token.");
    }
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
      } catch (err) {
        // Suppress invalid access token errors for optional protection
      }
    }
    next();
  } catch (error) {
    next();
  }
};
