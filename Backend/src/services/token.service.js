import jwt from "jsonwebtoken";

class TokenService {
  generateAccessToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET || "super_access_secret_key",
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "15m",
      }
    );
  }

  generateRefreshToken(payload) {
    return jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET || "super_refresh_secret_key",
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "7d",
      }
    );
  }

  verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET || "super_access_secret_key");
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || "super_refresh_secret_key");
  }
}

export default new TokenService();
