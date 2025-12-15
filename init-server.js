const Fastify = require("fastify");
const cors = require("@fastify/cors");
const { sequelize } = require("./services/db.service");
const multipart = require("@fastify/multipart");
const cookie = require("@fastify/cookie");

let cachedServer = null;
let dbInitialized = false;

// Detect production vs serverless (Vercel)
const isProd = process.env.NODE_ENV === "production";
const isServerless = !!process.env.VERCEL || process.env.KAPEHAN_SERVERLESS === "1";

console.log(
  `[Kapehan] Mode: ${isProd ? "PRODUCTION" : "DEVELOPMENT"} | Platform: ${isServerless ? "SERVERLESS (Vercel)" : "NODE"}`
);

// Database initialization
async function initDatabase() {
  if (dbInitialized) return;
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to Supabase");
    // Only sync in non-production (never in production)
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
  const fastify = Fastify({ logger: !isServerless });

  // Only register essential plugins for serverless
  await fastify.register(cors, {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://kapehan.ph",
      "localhost:3000",
      "https://v1.kapehan.ph/",
      "https://v1.kapehan.ph",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await fastify.register(multipart, { attachFieldsToBody: true });
  await fastify.register(cookie, { parseOptions: {} });

  // Tune database pool (keep minimal on serverless)
  if (sequelize && sequelize.connectionManager && sequelize.connectionManager.pool) {
    const max = isServerless ? 1 : 5;
    const min = isServerless ? 0 : 1;
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

  // Register routes under /v1
  await fastify.register(require("./routes/"), { prefix: "/v1" });

  // Root route to avoid 404 on /
  fastify.get("/", async (req, reply) => {
    reply.send({
      status: "ok",
      message: "Kapehan API",
      prefix: "/v1",
      hint: "Use /v1/* endpoints",
    });
  });

  // 404 handler
  fastify.setNotFoundHandler((req, reply) => {
    reply
      .code(404)
      .send({ message: `Route ${req.method}:${req.url} not found` });
  });

  // Error handler
  fastify.setErrorHandler((error, req, reply) => {
    // Always log error stack for debugging with request info
    console.error("❌ Fastify error:", {
      method: req?.method,
      url: req?.url,
      message: error?.message,
      stack: error?.stack,
    });
    if (!isServerless && fastify.log && fastify.log.error) fastify.log.error(error);
    reply.code(error.statusCode || 500).send({
      error: error.message || "Internal Server Error",
      stack: error.stack, // remove in prod if not needed
    });
  });

  await initDatabase();
  // Always await ready to ensure hooks/routes are initialized (even on serverless)
  await fastify.ready();
  console.log("✅ Fastify is ready");

  return fastify;
}

// Fastify server creation (returns cached or builds new)
async function createServer() {
  if (!cachedServer) {
    cachedServer = await buildServer();
  }
  return cachedServer;
}

// Local development server (start whenever not serverless, regardless of NODE_ENV)
if (!isServerless) {
  (async () => {
    try {
      const server = await createServer();
      server.listen({ port: 4000, host: "localhost" }, (err, address) => {
        if (err) {
          server.log.error(err);
          process.exit(1);
        }
        console.log(`🌐 Server running at ${address}`);
      });
    } catch (err) {
      console.error("❌ Failed to start server:", err);
      process.exit(1);
    }
  })();
}

// Vercel serverless handler
module.exports = async (req, res) => {
  try {
    const server = await createServer();
    server.server.emit("request", req, res);
    await new Promise((resolve, reject) => {
      res.on("finish", resolve);
      res.on("error", reject);
    });
  } catch (err) {
    // Always log error stack for debugging
    console.error("❌ Serverless handler error:", err && err.stack ? err.stack : err);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        error: err && err.message ? err.message : "Internal Server Error",
        stack: err && err.stack ? err.stack : undefined,
      }));
    }
  }
};
