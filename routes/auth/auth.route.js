const { login, verifyToken, maybeRefreshToken } = require('../../services/security.services');

module.exports = async function (app) {
  app.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body;

    const result = await login(email, password);

    if (!result.success) {
      return reply.code(401).send({ error: result.error });
    }

    return reply.send({
      access_token: result.session.access_token,
      user: result.user
    });
  });

  
  app.post('/auth/verify', async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing or invalid token' });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyToken(token);

    if (!user) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    return reply.send({ success: true, user });
  });


};