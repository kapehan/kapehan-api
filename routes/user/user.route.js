const {
  registerUserController,
  loginUserController,
  logoutUserController,
  getUserDataController,
  refreshTokenController,
} = require("../../controllers/users/users.controller");
const { authMiddleware } = require("../../middleware/middleware");
const { AccessLevels } = require("../../utils/accessLevels.js");
const { updateUserLocation } = require("../../controllers/users/anonymous.controller"); // renamed

async function userRoutes(fastify) {
  fastify.post("/user/login", loginUserController);
  fastify.post("/user/logout", logoutUserController);
  fastify.post("/user/register", registerUserController);
  fastify.get(
    "/user",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.GUEST },
    },
    getUserDataController
  );
  fastify.post(
    "/user/location",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.GUEST },
    },
    updateUserLocation // renamed from updateAnonymousUser
  );

  fastify.post("/user/refreshToken", refreshTokenController);
}

module.exports = userRoutes;
