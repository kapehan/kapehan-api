const {
  create,
  findAll,
  findById,
  update,
  remove,
} = require("../../controllers/reviews/reviews.controller");

async function reviewsRoutes(fastify) {
  // Create
  fastify.post("/review/create", create);

  // Get all
  fastify.get("/reviews", async (req, reply) => {
    const result = await findAll(req);
    return reply.send({
      data: result.results,
      pageInfo: result.pageInfo,
      status: 200,
    });
  });

  // Get by ID
  fastify.get("/review/:id", async (req, reply) => {
    try {
      const data = await findById(req);
      return reply.send({ data, status: 200 });
    } catch (err) {
      return reply.status(404).send({ message: err.message });
    }
  });

  // Update
  fastify.post("/review/:id/update", async (req, reply) => {
    try {
      const data = await update(req);
      return reply.send({ data, status: 200 });
    } catch (err) {
      return reply.status(404).send({ message: err.message });
    }
  });

  // Delete
  fastify.post("/review/:id/delete", async (req, reply) => {
    try {
      const data = await remove(req);
      return reply.send({ data, status: 200 });
    } catch (err) {
      return reply.status(404).send({ message: err.message });
    }
  });
}

module.exports = reviewsRoutes;
