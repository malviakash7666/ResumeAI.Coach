import db from "../database/models/index.js";
import tokenService from "./token.service.js";
import admin from "../config/firebase.config.js";
import { getAuth } from "firebase-admin/auth";
import { githubConfig } from "../config/github.config.js";
import ApiError from "../utils/ApiError.js";

const User = db.User;

class SocialAuthService {
  /**
   * Handle Google sign in using Firebase ID Token
   */
  async handleGoogleLogin(idToken) {
    if (!idToken) {
      throw new ApiError(400, "Firebase ID Token is required");
    }

    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Firebase ID Token verification error:", error);
      throw new ApiError(401, `Google verification failed: ${error.message}`);
    }

    const { name, email, picture, uid } = decodedToken;
    if (!email) {
      throw new ApiError(400, "Google profile must include an email address");
    }

    // Find or create user
    let user = await User.findOne({ where: { email } });

    if (user) {
      // Update existing user with provider details if empty
      await user.update({
        provider: "google",
        providerId: uid,
        avatar: user.avatar || picture,
        avatarUrl: user.avatarUrl || picture,
        lastLogin: new Date()
      });
    } else {
      user = await User.create({
        name: name || "Google User",
        email,
        avatar: picture,
        avatarUrl: picture,
        provider: "google",
        providerId: uid,
        role: "user",
        isVerified: true,
        lastLogin: new Date()
      });
    }

    const accessToken = tokenService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = tokenService.generateRefreshToken({ id: user.id });

    await user.update({ refreshToken });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        resumeUrl: user.resumeUrl,
        resumeAnalysis: user.resumeAnalysis,
        interviewHistory: user.interviewHistory,
      },
      accessToken,
      refreshToken
    };
  }

  /**
   * Handle GitHub sign in using Auth Code
   */
  async handleGithubLogin(code) {
    if (!code) {
      throw new ApiError(400, "GitHub authorization code is required");
    }

    let accessTokenResponse;
    try {
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          client_id: githubConfig.clientId,
          client_secret: githubConfig.clientSecret,
          code,
          redirect_uri: githubConfig.redirectUri
        })
      });
      accessTokenResponse = await response.json();
    } catch (err) {
      console.error("GitHub access token exchange network error:", err);
      throw new ApiError(500, "Failed to connect to GitHub server");
    }

    if (accessTokenResponse.error) {
      throw new ApiError(400, `GitHub OAuth error: ${accessTokenResponse.error_description || accessTokenResponse.error}`);
    }

    const gitAccessToken = accessTokenResponse.access_token;
    if (!gitAccessToken) {
      throw new ApiError(400, "No access token returned from GitHub");
    }

    // Fetch user details
    let gitUser;
    try {
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${gitAccessToken}` }
      });
      gitUser = await userRes.json();
    } catch (err) {
      console.error("Failed to fetch GitHub profile:", err);
      throw new ApiError(500, "Failed to fetch GitHub profile");
    }

    const providerId = String(gitUser.id);
    const name = gitUser.name || gitUser.login;
    const avatar = gitUser.avatar_url;

    // Fetch primary email
    let email = gitUser.email;
    if (!email) {
      try {
        const emailsRes = await fetch("https://api.github.com/user/emails", {
          headers: { Authorization: `token ${gitAccessToken}` }
        });
        const emails = await emailsRes.json();
        if (Array.isArray(emails)) {
          const primaryEmailObj = emails.find(e => e.primary && e.verified) || emails[0];
          email = primaryEmailObj?.email;
        }
      } catch (err) {
        console.warn("Failed to fetch GitHub user emails:", err);
      }
    }

    if (!email) {
      throw new ApiError(400, "GitHub profile must expose a verified email address");
    }

    let user = await User.findOne({ where: { email } });

    if (user) {
      await user.update({
        provider: "github",
        providerId,
        avatar: user.avatar || avatar,
        avatarUrl: user.avatarUrl || avatar,
        lastLogin: new Date()
      });
    } else {
      user = await User.create({
        name,
        email,
        avatar,
        avatarUrl: avatar,
        provider: "github",
        providerId,
        role: "user",
        isVerified: true,
        lastLogin: new Date()
      });
    }

    const accessToken = tokenService.generateAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = tokenService.generateRefreshToken({ id: user.id });

    await user.update({ refreshToken });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        avatarUrl: user.avatarUrl,
        resumeUrl: user.resumeUrl,
        resumeAnalysis: user.resumeAnalysis,
        interviewHistory: user.interviewHistory,
      },
      accessToken,
      refreshToken
    };
  }
}

export default new SocialAuthService();
