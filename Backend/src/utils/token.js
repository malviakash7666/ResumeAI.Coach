import jwt from "jsonwebtoken";

/* =========================
   ENV SECRETS
========================= */
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

/* =========================
   ACCESS TOKEN (15 min)
========================= */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

/* =========================
   REFRESH TOKEN (7 days)
========================= */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: "7d",
  });
};