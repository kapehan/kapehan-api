const authController = require("../../controllers/auth/auth.controller");

async function userRoutes(fastify) {
    fastify.post("/auth/send-verification", authController.sendEmailVerification);

    fastify.post("/auth/forgot-password", authController.requestPasswordReset);
    fastify.post("/auth/reset-password", authController.verifyResetAndChangePassword);
}

module.exports = userRoutes;

