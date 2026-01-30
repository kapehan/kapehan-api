// init-server.js (updated for Fly/Docker public deployment)

const Fastify = require("fastify");
const cors = require("@fastify/cors");
const { sequelize } = require("./services/db.service");
const multipart = require("@fastify/multipart");
const cookie = require("@fastify/cookie");

let cachedServer = null;
let dbInitialized = false;

// You're no longer using Vercel/serverless
const isServerless = false;
const isProd = process.env.NODE_ENV === "production";

console.log(
  `[Kapehan] Mode: ${isProd ? "PRODUCTION" : "DEVELOPMENT"} | Platform: NODE`
);

// Database initialization
async function initDatabase() {
  if (dbInitialized) return;
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to Supabase");

    // Sync ONLY in local dev (never in prod)
    if (!isProd) {
      await sequelize.sync();
      console.log("✅ Tables synced (dev only)");
    }

    dbInitialized = true;
  } catch (err) {
    console.error("❌ Database error:", err);
    throw err;
  }
}

// Build Fastify instance and register plugins/routes ONCE
async function buildServer() {
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: [
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://localhost:3000",
      "https://kapehan.ph",
      "https://www.kapehan.ph",
      "https://v1.kapehan.ph",
      "https://hq.kapehan.ph",
      "https://www.hq.kapehan.ph",
      // add your Fly frontend domain here if you have one, e.g.
      // "https://kapehan-frontend.fly.dev",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await fastify.register(multipart, { attachFieldsToBody: true });
  await fastify.register(cookie, { parseOptions: {} });

  // Pool tuning (non-serverless)
  if (sequelize?.connectionManager?.pool) {
    const max = 5;
    const min = 1;
    sequelize.connectionManager.pool.max = max;
    sequelize.connectionManager.pool.min = min;
    sequelize.options.pool = {
      ...(sequelize.options.pool || {}),
      max,
      min,
      idle: 10000,
      acquire: 20000,
      evict: 1000,
    };
    sequelize.options.dialectOptions = {
      ...(sequelize.options.dialectOptions || {}),
      keepAlive: true,
    };
  }

  // Register routes
  await fastify.register(require("./routes/"), { prefix: "/v1" });

  // Root
  fastify.get("/", async (req, reply) => {
    reply.send({ status: "ok", message: "Kapehan API", prefix: "/v1" });
  });

  // 404
  fastify.setNotFoundHandler((req, reply) => {
    reply.code(404).send({ message: `Route ${req.method}:${req.url} not found` });
  });

  // Error handler
  fastify.setErrorHandler((error, req, reply) => {
    console.error("❌ Fastify error:", {
      method: req?.method,
      url: req?.url,
      message: error?.message,
      stack: error?.stack,
    });

    reply.code(error.statusCode || 500).send({
      error: error.message || "Internal Server Error",
      // consider removing stack in prod:
      stack: isProd ? undefined : error.stack,
    });
  });

  await initDatabase();
  await fastify.ready();
  console.log("✅ Fastify is ready");
  return fastify;
}

async function createServer() {
  if (!cachedServer) cachedServer = await buildServer();
  return cachedServer;
}

// Start server (Fly/Docker expects 0.0.0.0 and PORT)
(async () => {
  try {
    const server = await createServer();
    const port = Number(process.env.PORT || 3000);

    await server.listen({ port, host: "0.0.0.0" });
    console.log(`🌐 Server running at http://0.0.0.0:${port}`);
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
