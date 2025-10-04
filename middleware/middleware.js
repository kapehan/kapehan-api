// middlewares/authMiddleware.js
const { authenticateUser } = require("../utils/authUtils.js");

async function authMiddleware(request, reply) {
  try {
    await authenticateUser(request, reply);
    // proceed to route
  } catch (err) {
    console.warn("[AuthMiddleware] Authentication failed:", err.message);
    return reply.code(401).send({ error: err.message });
  }
}

module.exports = { authMiddleware };
