// middlewares/authMiddleware.js
import { authenticateUser } from "../utils/authUtils.js";

export async function authMiddleware(request, reply) {
  try {
    await authenticateUser(request, reply);
    // Log the user_id (null for guests)
    console.log("[AuthMiddleware] user_id:", request?.user?.id || null);
    return request?.user?.id
  } catch (err) {
    console.warn("[AuthMiddleware] Authentication failed:", err.message);
    return reply.code(401).send({ error: err.message });
  }
}
