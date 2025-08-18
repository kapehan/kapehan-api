const cors = require("@fastify/cors");

async function corsPlugin(fastify) {
  fastify.register(cors, {
    origin: [
      "https://kapehan.ph",
      "https://god.kapehan.ph/"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
}

module.exports = corsPlugin;
