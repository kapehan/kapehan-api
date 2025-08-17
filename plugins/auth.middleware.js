
const { verifyToken } = require('../services/security.services');

async function authMiddleware(request, reply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const user = await verifyToken(token);

  if (!user) {
    return reply.code(401).send({ error: 'Invalid token' });
  }

  // Attach user to request object
  request.user = user;
}

module.exports = authMiddleware;