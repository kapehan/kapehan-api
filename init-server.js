const Fastify = require("fastify");
const cors = require("@fastify/cors");
const rateLimit = require("@fastify/rate-limit");
const { sequelize } = require("./services/db.service");
const config = require("./configs/config");
const multipart = require("@fastify/multipart");
const cookie = require("@fastify/cookie");

let cachedServer = null;
let dbInitialized = false;

// Database initialization
async function initDatabase() {
  if (dbInitialized) return;
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to Supabase");
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync();
      console.log("✅ Tables synced (dev only)");
    }
    dbInitialized = true;
  } catch (err) {
    console.error("❌ Database error:", err);
    throw err;
  }
}

// Fastify server creation
async function createServer() {
  const fastify = Fastify({ logger: true });

  // Collect registered routes
  const registeredRoutes = [];
  fastify.addHook("onRoute", (routeOptions) => {
    const methods = Array.isArray(routeOptions.method)
      ? routeOptions.method
      : [routeOptions.method];
    const url = routeOptions.path || routeOptions.url || ""; // Fastify may use path or url
    methods.forEach((m) => {
      const method = (m || "").toUpperCase();
      if (!method || !url) return;
      registeredRoutes.push({ method, url });
    });
  });

  // Register CORS directly (MUST BE FIRST)
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

  // Register other plugins
  await fastify.register(multipart, { attachFieldsToBody: true });
  await fastify.register(cookie, { parseOptions: {} });
  await fastify.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  // Register routes
  await fastify.register(require("./routes/"), { prefix: "/v1" });

  // 404 handler
  fastify.setNotFoundHandler((req, reply) => {
    reply
      .code(404)
      .send({ message: `Route ${req.method}:${req.url} not found` });
  });

  // Error handler
  fastify.setErrorHandler((error, req, reply) => {
    fastify.log.error(error);
    reply
      .code(error.statusCode || 500)
      .send({ error: error.message || "Internal Server Error" });
  });

  await initDatabase();
  await fastify.ready();

  // Pretty-print routes as a simple list
  const unique = new Map();
  for (const r of registeredRoutes) {
    const key = `${r.method} ${r.url}`;
    if (!unique.has(key)) unique.set(key, r);
  }
  const lines = Array.from(unique.values())
    .sort((a, b) => {
      if (a.url === b.url) return a.method.localeCompare(b.method);
      return a.url.localeCompare(b.url);
    })
    .map((r) => `${r.method.padEnd(6)} ${r.url}`)
    .join("\n");

  fastify.log.info("Registered routes:\n" + lines);

  return fastify;
}

// Local development server
if (!process.env.VERCEL) {
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
