const Fastify = require("fastify");
const corsPlugin = require("./configs/cors.config");
const rateLimit = require("@fastify/rate-limit");

const fastify = Fastify({ logger: true });
let isServerBuilt = false;

async function buildServer() {
  if (isServerBuilt) {
    await fastify.ready();
    return fastify;
  }

  try {
    await fastify.register(corsPlugin);
    fastify.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
    });
    fastify.register(require("./routes/"), { prefix: "/v1" });

    isServerBuilt = true;
    await fastify.ready();
    fastify.log.info("Fastify server built successfully");
    return fastify;
  } catch (err) {
    fastify.log.error("Error building Fastify server:", err);
    throw err;
  }
}

if (!process.env.VERCEL) {
  buildServer()
    .then(() => {
      fastify.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
        if (err) {
          fastify.log.error("Error starting server:", err);
          process.exit(1);
        }
        fastify.log.info(`Server running locally at ${address}`);
      });
    })
    .catch((err) => {
      fastify.log.error("Failed to build server locally:", err);
      process.exit(1);
    });
}

module.exports = async (req, res) => {
  try {
    const server = await buildServer();
    await new Promise((resolve, reject) => {
      server.server.emit("request", req, res);
      res.on("finish", resolve);
      res.on("error", reject);
    });
  } catch (err) {
    console.error("Serverless handler error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
};
