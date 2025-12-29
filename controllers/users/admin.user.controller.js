const { sendSuccess, sendError } = require("../../utils/response");
const auth = require("../../services/user/admin.user");
const jwt = require("jsonwebtoken");

async function loginUserAdminController(req, reply) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return reply
        .code(400)
        .send(sendError("Email and password are required fields."));
    }

    const { isSuccess, accessToken, refreshToken, userId } =
      await auth.loginAdminUser(email, password);

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

async function getUserDataController(req, reply) {
  try {
    const accessToken = req.cookies["sb-access-token"];
    if (!accessToken) {
      return reply.code(401).send(sendError("Access token is required."));
    }
    try {
      const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
      const decoded = jwt.verify(accessToken, SUPABASE_JWT_SECRET);
      const userId = decoded.sub;
      const supabaseResponse = await auth.getUserData(
        userId,
        accessToken
      );
      const data =
        supabaseResponse?.data ||
        supabaseResponse?.user ||
        supabaseResponse ||
        {};

      return reply.send(
        sendSuccess({ ...data }, "User successfully retrieved")
      );
    } catch (err) {
      console.warn("⚠️ Invalid access token:", err.message);
      return reply
        .code(401)
        .send(sendError("Invalid or expired access token."));
    }
  } catch (err) {
    console.error("Get user data exception:", err);
    return reply.code(500).send(sendError(err.message));
  }
}

async function getAllUsers(req, reply) {
  try {
    const { role, search } = req.query; // Extract query parameters for filtering
    const users = await auth.getAllUsers({ query: { role, search } }); // Call the service function
    return reply.send(sendSuccess(users, "Users successfully retrieved"));
  } catch (err) {
    console.error("Get all users exception:", err);
    return reply.code(500).send(sendError(err.message));
  }
}

module.exports = {
  loginUserAdminController,
  getUserDataController,
  getAllUsers, // Export the new function
};
