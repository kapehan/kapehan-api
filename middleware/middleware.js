// middlewares/authMiddleware.js
import { authenticateUser } from "../utils/authUtils.js";

export async function authMiddleware(request, reply) {
  try {
    await authenticateUser(request, reply);
    // proceed to route
  } catch (err) {
    console.warn("[AuthMiddleware] Authentication failed:", err.message);
    return reply.code(401).send({ error: err.message });
  }
}
