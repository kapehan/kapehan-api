const {
  loginUserAdminController,
  getUserDataController,
  getAllUsers,
} = require("../../controllers/users/admin.user.controller");
const { authMiddleware } = require("../../middleware/middleware");
const { AccessLevels } = require("../../utils/accessLevels.js");

async function userRoutes(fastify) {
  fastify.post("/auth/user/login", loginUserAdminController);
  fastify.get(
    "/auth/user",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.ADMIN },
    },
    getUserDataController
  );

  fastify.get(
    "/auth/users",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.ADMIN },
    },
    getAllUsers
  );
}

module.exports = userRoutes;
