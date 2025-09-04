// src/middlewares/authMiddleware.js
const { authenticateUser } = require("../utils/authUtils");

async function authMiddleware(request, reply) {
  try {
    const user = await authenticateUser(request);
    request.user = user; // attach to request object
  } catch (err) {
    reply.code(401).send({ error: "Unauthorized: Invalid session token." });
  }
}

module.exports = { authMiddleware };
