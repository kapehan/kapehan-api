const Fastify = require("fastify");
const corsPlugin = require("./configs/cors.config");
const rateLimit = require("@fastify/rate-limit");
const { sequelize } = require("./services/db.service");

let cachedServer = null;
let dbInitialized = false; // ✅ ensures DB connects/syncs only once

async function initDatabase() {
  if (dbInitialized) return;

  try {
    await sequelize.authenticate();
    console.log("✅ Service connected to Supabase");

    await sequelize.sync({ alter: true }); // create/alter tables
    console.log("✅ Tables synced successfully");

    dbInitialized = true;
  } catch (err) {
    console.error("❌ Failed to connect or sync database:", err);
    process.exit(1);
  }
}

// Create Fastify server
async function createServer() {
  const fastify = Fastify({ logger: true });

  await fastify.register(corsPlugin);
  fastify.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  console.log("🔹 Registering routes with /v1 prefix");
  await fastify.register(require("./routes/"), { prefix: "/v1" });

  fastify.addHook("onRequest", (req, reply, done) => {
    console.log(`📩 Incoming request: ${req.method} ${req.url}`);
    done();
  });

  fastify.setNotFoundHandler((req, reply) => {
    console.warn(`❌ Route not found: ${req.method}:${req.url}`);
    reply
      .code(404)
      .send({ message: `Route ${req.method}:${req.url} not found` });
  });

  // 🔹 Initialize DB (once)
  await initDatabase();

  await fastify.ready();
  console.log("✅ Fastify server built successfully");
  return fastify;
}

// Local server
if (!process.env.VERCEL) {
  createServer()
    .then((server) => {
      server.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
        if (err) {
          server.log.error(err);
          process.exit(1);
        }
        console.log(`🌐 Server running locally at ${address}`);
      });
    })
    .catch((err) => {
      console.error("❌ Failed to start local server:", err);
      process.exit(1);
    });
}

// Vercel serverless handler
module.exports = async (req, res) => {
  try {
    if (!cachedServer) cachedServer = await createServer();

    cachedServer.server.emit("request", req, res);

    await new Promise((resolve, reject) => {
      res.on("finish", resolve);
      res.on("error", reject);
    });
  } catch (err) {
    console.error("❌ Serverless handler error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
};
