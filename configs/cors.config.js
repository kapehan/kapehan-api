const cors = require("@fastify/cors");

async function corsPlugin(fastify) {
  await fastify.register(cors, {
    origin: (origin, cb) => {
      cb(null, true); // ✅ allow all origins dynamically
    },
    credentials: true, // allow cookies/session tokens
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}

module.exports = corsPlugin;
