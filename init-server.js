import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";

const fastify = Fastify();

// Register CORS
await fastify.register(cors, {
  origin: true, // or set specific domain
});

// Register rate limit
await fastify.register(rateLimit, {
  max: 100, // max requests
  timeWindow: "1 minute",
});

// Routes
fastify.get("/", async () => {
  return { message: "Hello Fastify" };
});

fastify.listen({ port: 3000 });
