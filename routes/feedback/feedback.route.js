const { create, findAll, findById, remove } = require("../../modules/feedback/feedback.controller.js");
const { authMiddleware } = require("../../middleware/middleware.js");
const { AccessLevels } = require("../../utils/accessLevels.js");

module.exports = async function feedbackRoutes(fastify) {
  // Create feedback
  fastify.post(
    "/feedback/create",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.ADMIN }, // Only admin can access
    },
    async (req, reply) => {
      try {
        const createdFeedback = await create(req); // pass the body if needed
        reply.code(201).send({
          message: "Feedback created successfully",
          data: createdFeedback,
        });
      } catch (err) {
        reply.code(500).send({
          message: err.message || "Failed to create feedback",
        });
      }
    }
  );

  // Get all feedback
  fastify.get(
    "/feedback",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.ADMIN },
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

  // Get feedback by ID
  fastify.get(
    "/feedback/:id",
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

  // Delete feedback
  fastify.post(
    "/feedback/:id/delete",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.ADMIN },
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
};
