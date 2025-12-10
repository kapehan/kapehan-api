// ./configs/cors.config.js
const cors = require("@fastify/cors");

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://kapehan.ph",
  "https://god.kapehan.ph",
];

async function corsPlugin(fastify) {
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow server-to-server (no origin)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) {
        // ✅ Must return origin itself (not true) when credentials = true
        return cb(null, origin);
      }

      fastify.log?.warn?.(`🚫 CORS blocked for origin: ${origin}`);
      // ✅ Don't throw errors — just deny
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"], // optional, helps with cookies visibility
  });
}

module.exports = corsPlugin;
