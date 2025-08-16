const Fastify = require("fastify");
const cors = require("@fastify/cors");
const rateLimit = require("@fastify/rate-limit");

const fastify = Fastify();

// Register CORS
fastify.register(cors, {
  origin: true, // or set specific domain
});

// Register rate limit
fastify.register(rateLimit, {
  max: 100, // max requests
  timeWindow: "1 minute",
});

fastify.register(require("./routes/"));


fastify.listen({ port: 3000 });
  console.log('Server listening on http://localhost:3000')
