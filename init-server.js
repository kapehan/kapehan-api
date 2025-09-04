const Fastify = require("fastify");
const corsPlugin = require("./configs/cors.config");
const rateLimit = require("@fastify/rate-limit");
const { sequelize } = require("./services/db.service");
const authMiddleware = require("./middleware/middleware");
const config = require("./configs/config");
const jwt = require("@fastify/jwt");
const multipart = require("@fastify/multipart");
const cookie = require("@fastify/cookie");

let cachedServer = null;
let dbInitialized = false;

// Initialize DB
async function initDatabase() {
  if (dbInitialized) return;

  try {
    await sequelize.authenticate();
    console.log("✅ Service connected to Supabase");

    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("✅ Tables synced (dev only)");
    }

    dbInitialized = true;
  } catch (err) {
    console.error("❌ Failed to connect or sync database:", err);
    throw err; // ❌ avoid process.exit in serverless
  }
}

// Create Fastify server
async function createServer() {
  const fastify = Fastify({ logger: true });

  await Promise.all([
    fastify.register(jwt, { secret: config.auth_secret }),
    fastify.register(multipart, { attachFieldsToBody: true }),
    fastify.register(corsPlugin),
    fastify.register(rateLimit, { max: 100, timeWindow: "1 minute" }),
    fastify.register(require("./routes/"), { prefix: "/v1" }),
  ]);

  // // ⚠️ Apply verify only where needed (instead of globally if you’ll have public routes)
  // fastify.addHook("preHandler", async (request, reply) => {
  //   await verify(fastify, request, reply);
  // });

  fastify.register(cookie, {
    parseOptions: {}, // no secret → cookies are plain
  });

  fastify.setNotFoundHandler((req, reply) => {
    console.warn(`❌ Route not found: ${req.method}:${req.url}`);
    reply
      .code(404)
      .send({ message: `Route ${req.method}:${req.url} not found` });
  });

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

// Vercel handler
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
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
  }
};
