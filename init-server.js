const Fastify = require("fastify");
const corsPlugin = require("./configs/cors.config");
const rateLimit = require("@fastify/rate-limit");

let cachedServer = null;

async function createServer() {
  const fastify = Fastify({ logger: true });

  await fastify.register(corsPlugin);
  fastify.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  await fastify.register(require("./routes/"), { prefix: "/v1" });

  await fastify.ready();
  return fastify;
}

if (!process.env.VERCEL) {
  createServer().then(server => {
    server.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
      if (err) {
        server.log.error(err);
        process.exit(1);
      }
      server.log.info(`Server running locally at ${address}`);
    });
  });
}

module.exports = async (req, res) => {
  if (!cachedServer) cachedServer = await createServer();
  await new Promise((resolve, reject) => {
    cachedServer.server.emit("request", req, res);
    res.on("finish", resolve);
    res.on("error", reject);
  });
};
