const cors = require("@fastify/cors");

async function corsPlugin(fastify) {
  fastify.register(cors, {
    origin: [
      "http://localhost:3000",
      "https://kapehan.ph",
      "https://staging.kapehan.ph"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
}

module.exports = corsPlugin;
