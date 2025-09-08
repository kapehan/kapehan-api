const {
  registerUserController,
  loginUserController,
  logoutUserController,
  getUserDataController,
} = require("../../controllers/users/users.controller");

const { authMiddleware } = require("../../middleware/middleware");

async function userRoutes(fastify) {
  fastify.post("/login", loginUserController);
  fastify.post("/logout", logoutUserController);
  fastify.get("/user/:id", getUserDataController);
}

module.exports = userRoutes;
