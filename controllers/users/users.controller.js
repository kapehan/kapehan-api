// src/controllers/user/auth.controller.js
const userService = require("../../services/user/userService");
const jwt = require("jsonwebtoken");
const { sendSuccess, sendError } = require("../../utils/response");
const { getOrCreateAnonymousUser } = require("../users/anonymous.controller");
/**
 * Register user
 */
async function registerUserController(req, reply) {
  try {
    const { email, password, city, username, name, gender } = req.body;
    console.log("req body", req.body);

    const data = await userService.registerUser(email, password, city, username, name, gender);

    const isProduction = process.env.NODE_ENV === "production";
    reply
      .setCookie("sb-access-token", data.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        path: "/",
        maxAge: 60 * 60,
      })
      .setCookie("sb-refresh-token", data.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

    // Clear anonymous token on register (force overwrite with empty value and immediate expiry)
    reply.setCookie("sb-access-anon-token", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "Strict",
      path: "/",
      expires: new Date(0),
    });

    return reply.code(201).send(sendSuccess(data, "User registered successfully"));
  } catch (error) {
    console.error("Register user error:", error);
    return reply.code(400).send(sendError(error.message));
  }
}

/**
 * Login user
 */
async function loginUserController(req, reply) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return reply.code(400).send(sendError("Email and password are required fields."));
    }

    const { isSuccess, accessToken, refreshToken, userId } = await userService.loginUser(email, password);

    if (!isSuccess) {
      return reply.code(401).send(sendError("Login failed."));
    }

    const isProduction = process.env.NODE_ENV === "production";

    // Set cookies
    reply
      .setCookie("sb-access-token", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        path: "/",
        maxAge: 60 * 60, // 1 hour
      })
      .setCookie("sb-refresh-token", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

    // Clear anonymous token on login
    reply.clearCookie("sb-access-anon-token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "Strict",
      path: "/",
    });

    return reply.send(sendSuccess({ id: userId }, "Login successful"));
  } catch (error) {
    console.error("Login controller error:", error);
    return reply.code(500).send(sendError("Server error: " + error.message));
  }
}

/**
 * Logout user
 */
async function logoutUserController(req, reply) {
  try {
    await userService.logoutUser();

    // Clear cookies
    reply.clearCookie("sb-access-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/",
    });

    reply.clearCookie("sb-refresh-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/",
    });

    // Clear anonymous token on logout
    reply.clearCookie("sb-access-anon-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/",
    });

    return reply.send(sendSuccess(null, "Logout successful"));
  } catch (error) {
    console.error("Logout controller error:", error);
    return reply.code(500).send(sendError(error.message));
  }
}

/**
 * Get current user data (authenticated or anonymous)
 * Single identity resolver endpoint
 */
async function getUserDataController(req, reply) {
  try {
    // 1) Try authenticated user first
    const accessToken = req.cookies["sb-access-token"];
    if (accessToken) {
      try {
        const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
        const decoded = jwt.verify(accessToken, SUPABASE_JWT_SECRET);
        const userId = decoded.sub;
        const supabaseResponse = await userService.getUserData(userId, accessToken);
        const data = supabaseResponse?.data || supabaseResponse?.user || supabaseResponse || {};

        return reply.send(sendSuccess({ ...data, role: "user" }, "User successfully retrieved"));
      } catch (err) {
        console.warn("⚠️ Invalid access token, falling back to anonymous:", err.message);
      }
    }

    // 2) Fallback to anonymous (delegate to anonymous controller)
    return await getOrCreateAnonymousUser(req, reply);
  } catch (err) {
    console.error("Get user data exception:", err);
    return reply.code(500).send(sendError(err.message));
  }
}

/**
 * Refresh token
 */
async function refreshTokenController(req, reply) {
  try {
    const refreshToken = req.cookies["sb-refresh-token"];
    if (!refreshToken) {
      return reply.code(401).send(sendError("No refresh token provided"));
    }

    const { data, error } = await userService.refreshSession(refreshToken);

    if (error || !data?.session) {
      return reply.code(401).send(sendError("Invalid refresh token"));
    }

    console.log("✅ Refresh triggered successfully");

    const { session } = data;
    const newAccessToken = session.access_token;
    const newRefreshToken = session.refresh_token;
    const isProduction = process.env.NODE_ENV === "production";

    // Set new cookies
    reply
      .setCookie("sb-access-token", newAccessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        path: "/",
        maxAge: 60 * 60, // 1 hour
      })
      .setCookie("sb-refresh-token", newRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "Strict" : "Lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

    return reply.send(
      sendSuccess(
        {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          user: session.user,
        },
        "Token refreshed successfully"
      )
    );
  } catch (err) {
    console.error("Refresh token error:", err);
    return reply.code(500).send(sendError("Internal server error"));
  }
}

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController,
  getUserDataController,
  refreshTokenController,
};
