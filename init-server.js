const Fastify = require("fastify");
const corsPlugin = require("./configs/cors.config");
const rateLimit = require("@fastify/rate-limit");

const fastify = Fastify({ logger: true });

// Flag to make sure we only register plugins once
let isServerBuilt = false;

async function buildServer() {
  if (!isServerBuilt) {
    await fastify.register(corsPlugin);

    fastify.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
    });

    fastify.register(require("./routes/"), { prefix: "/v1" });

    isServerBuilt = true;
  }

  await fastify.ready();
  return fastify;
}

if (!process.env.VERCEL) {
  buildServer().then(() => {
    fastify.listen({ port: 3000, host: "0.0.0.0" }).catch((err) => {
      fastify.log.error(err);
      process.exit(1);
    });
  });
}

module.exports = async (req, res) => {
  const server = await buildServer();
  server.server.emit("request", req, res);
};
