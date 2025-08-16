const {
  getAllReviews,
  getReviewById,
  createReview,
  deleteReview,
} = require("../../controllers/reviews/reviews.controller");

async function reviewsRoutes(fastify) {
  fastify.get("/reviews", getAllReviews);
  fastify.get("/review/:id", getReviewById);
  fastify.post("/review", createReview);
  fastify.delete("/review/:id", deleteReview);
}

module.exports = reviewsRoutes;
