export const githubConfig = {
  clientId: process.env.GITHUB_CLIENT_ID || "",
  clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  redirectUri: process.env.GITHUB_REDIRECT_URI || "http://localhost:5000/auth/github/callback",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173"
};
