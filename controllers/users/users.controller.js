// src/controllers/user/auth.controller.js
const userService = require("../../services/user/auth.service");

/**
 * Register a new user
 */
async function registerUserController(req, reply) {
  try {
    const { email, password, city, username } = req.body;

    const data = await userService.registerUser(
      email,
      password,
      city,
      username
    );

    return reply.send({ 
      message: "User registered successfully", 
      data 
    });
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
}

/**
 * Login user
 */
async function loginUserController(req, reply) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return reply.status(400).send({
        error: "Email and password are required fields.",
      });
    }

    const { isSuccess, accessToken, refreshToken, userId } = await userService.loginUser(
      email,
      password
    );

    console

    if (!isSuccess) {
      return reply.status(401).send({
        error: "Login failed.",
        isSuccess: false,
      });
    }

    reply
      .setCookie("sb-access-token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        path: "/",
        maxAge: 60 * 60, // 1 hour
      })
      .setCookie("sb-refresh-token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

    return reply.send({
      message: "Login successful",
      isSuccess: true,
      id: userId

    });
  } catch (error) {
    console.error("Login controller error:", error);
    return reply.status(500).send({
      error: "Server error: " + error.message,
    });
  }
}

/**
 * Logout user
 */
async function logoutUserController(req, reply) {
  try {
    await userService.logoutUser();

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

    return reply.send({
      message: "Logout successful",
      isSuccess: true,
    });
  } catch (error) {
    return reply.status(500).send({ 
      error: error.message, 
      isSuccess: false 
    });
  }
}

/**
 * Get current user data
 */
async function getUserDataController(request, reply) {
  try {
    const userId = request.params.id;

    if (!userId) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const data = await userService.getUserData(userId);

    return reply.send({ userData: data });
  } catch (err) {
    console.error("getUserData exception:", err);
    return reply.code(500).send({ error: err.message });
  }
}



module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController,
  getUserDataController,
};
