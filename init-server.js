const Fastify = require("fastify");
const corsPlugin = require("./configs/cors.config");
const rateLimit = require("@fastify/rate-limit");

let cachedServer = null;

async function createServer() {
  const fastify = Fastify({ logger: true });

  try {
    await fastify.register(corsPlugin);
    fastify.register(rateLimit, {
      max: 100,
      timeWindow: "1 minute",
    });
    fastify.register(require("./routes/"), { prefix: "/v1" });

    await fastify.ready();
    return fastify;
  } catch (err) {
    fastify.log.error("Error building Fastify server:", err);
    throw err;
  }
}

if (!process.env.VERCEL) {
  createServer()
    .then((server) => {
      server.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
        if (err) {
          server.log.error(err);
          process.exit(1);
        }
        server.log.info(`Server running locally at ${address}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start local server:", err);
      process.exit(1);
    });
}

module.exports = async (req, res) => {
  try {
    if (!cachedServer) {
      cachedServer = await createServer();
    }

    await new Promise((resolve, reject) => {
      cachedServer.server.emit("request", req, res);
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
