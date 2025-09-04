const {
  create,
  findAll,
  findById,
  update,
  remove,
} = require("../../controllers/reviews/reviews.controller");
const { authMiddleware } = require("../../middleware/middleware.js");
const { AccessLevels } = require("../../utils/accessLevels.js");

async function reviewsRoutes(fastify) {
  fastify.post(
    "/review/create",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.USER }, // Only admin can access
    },
    async (req, reply) => {
      try {

        // Call your create function
        const createdReview = await create(req); // pass the body if needed

        // Send response
        reply.code(201).send({
          message: "Review created successfully",
          data: createdReview,
        });
      } catch (err) {
        // Handle errors gracefully
        reply.code(500).send({
          message: err.message || "Failed to create review",
        });
      }
    }
  );

  // Get all
  fastify.get(
    "/reviews",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.GUEST },
    },
    async (req, reply) => {
      const result = await findAll(req);
      return reply.send({
        data: result.results,
        pageInfo: result.pageInfo,
        status: 200,
      });
    }
  );

  // Get by ID
  fastify.get(
    "/review/:id",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.ADMIN },
    },
    async (req, reply) => {
      try {
        const data = await findById(req);
        return reply.send({ data, status: 200 });
      } catch (err) {
        return reply.status(404).send({ message: err.message });
      }
    }
  );
  // Delete
  fastify.post(
    "/review/:id/delete",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.USER },
    },
    async (req, reply) => {
      try {
        const data = await remove(req);
        return reply.send({ data, status: 200 });
      } catch (err) {
        return reply.status(404).send({ message: err.message });
      }
    }
  );
}

module.exports = reviewsRoutes;
