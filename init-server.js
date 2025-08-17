const Fastify = require("fastify");
const corsPlugin = require("./configs/cors.config");
const rateLimit = require("@fastify/rate-limit");

const fastify = Fastify({ logger: true });

async function start() {
  await fastify.register(corsPlugin);

  fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  fastify.register(require("./routes/"), { prefix: "/v1" });

  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
