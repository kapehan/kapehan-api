const {
  registerUserController,
  loginUserController,
  logoutUserController,
  getUserDataController,
  updateUserDataController,
  refreshTokenController,
} = require("../../controllers/users/users.controller");

const { authMiddleware } = require("../../middleware/middleware");
const { AccessLevels } = require("../../utils/accessLevels.js");

async function userRoutes(fastify) {
  fastify.post("/user/login", loginUserController);
  fastify.post("/user/logout", logoutUserController);
  fastify.post("/user/register", registerUserController);
  fastify.get(
    "/user",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.USER },
    },
    getUserDataController
  );

  fastify.post("/user/refreshToken", refreshTokenController);
}

module.exports = userRoutes;
