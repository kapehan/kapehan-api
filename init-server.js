const Fastify = require("fastify");
const corsPlugin = require("./configs/cors.config");
const rateLimit = require("@fastify/rate-limit");
const fastify = Fastify();

async function start() {
  await fastify.register(corsPlugin);

  fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  fastify.register(require("./routes/"), { prefix: "/v1" });

  try {
    await fastify.listen({ port: 3000 });
    console.log("Server listening on http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
