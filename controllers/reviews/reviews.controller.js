

exports.getAllReviews = async (request, reply) => {
  return [{ id: 1, comment: "Great coffee!", rating: 5 }];
};

exports.getReviewById = async (request, reply) => {
  const { id } = request.params;
  return { id, comment: "Sample review", rating: 4 };
};

exports.createReview = async (request, reply) => {
  const { shop, rating, comment } = request.body;
  return { id: Date.now(), shop, rating, comment };
};

exports.updateReview = async (request, reply) => {
  const { id } = request.params;
  const { rating, comment } = request.body;
  return { id, rating, comment };
};

exports.deleteReview = async (request, reply) => {
  const { id } = request.params;
  return { message: `Review ${id} deleted` };
};
