// src/routes/users/user.routes.js
const {
  registerUserController,
  loginUserController,
  logoutUserController,
  getUserDataController,
} = require("../../controllers/users/users.controller");

const { authMiddleware } = require("../../middleware/middleware");

async function userRoutes(fastify) {
  // Register
  fastify.post("/", registerUserController);

  // Login
  fastify.post("/login", loginUserController);

  // Logout
  fastify.post("/logout", logoutUserController);

  // Get user by ID (protected)
  fastify.get("/user/:userId", { preHandler: authMiddleware }, getUserDataController);
}

module.exports = userRoutes;
