const Fastify = require("fastify");
const cors = require("@fastify/cors");
const rateLimit = require("@fastify/rate-limit");
const verify = require("./middleware/middleware");
const fastify = Fastify();

fastify.register(jwt, {
  secret: config.auth_secret
});

// Register CORS
fastify.register(corsPlugin);

// Register rate limit
fastify.register(rateLimit, {
  max: 100, // max requests
  timeWindow: "1 minute",
});

fastify.register(require("./routes/"));

fastify.addHook('preHandler', async (request, reply) => {
  const url = request.url;
  const excludedPaths = []; // excluded route
  if (excludedPaths.includes(`${url}`)) return;
  await verify(fastify, request, reply);
});

fastify.listen({ port: 3000 });
console.log('Server listening on http://localhost:3000')
