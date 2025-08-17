const Fastify = require("fastify");
const corsPlugin = require("./configs/cors.config");
const rateLimit = require("@fastify/rate-limit");

const fastify = Fastify({ logger: true });

async function buildServer() {
  await fastify.register(corsPlugin);

  fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  fastify.register(require("./routes/"), { prefix: "/v1" });

  return fastify;
}

async function startLocal() {
  await buildServer();
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("Server running locally at http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    await buildServer();
    await fastify.ready();
    fastify.server.emit("request", req, res);
  };
} else {
  // Local server
  startLocal();
}
