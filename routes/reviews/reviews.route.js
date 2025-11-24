const controller = require("../../controllers/review/reviews.controller.js");
const { authMiddleware } = require("../../middleware/middleware.js");
const { AccessLevels } = require("../../utils/accessLevels.js");
const { sendError } = require("../../utils/response");

async function reviewsRoutes(app) {
  app.post(
    "/review/:id/create",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.USER },
    },
    controller.create
  );

  app.get(
    "/reviews/:id",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.GUEST },
    },
    controller.findById
  );

  app.post(
    "/review/:reviewId/delete", // changed param name
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.USER },
    },
    controller.remove
  );

    app.post(
    "/review/:slug/update", // changed param name
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.USER },
    },
    controller.update
  );
}

module.exports = reviewsRoutes;
