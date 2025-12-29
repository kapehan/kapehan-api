const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const CoffeeShopReviews = require("../../services/reviews/reviews.service");
const { coffee_shops, coffee_shop_reviews } = require("../../services/db.service"); // added coffee_shop_reviews
const { sendError } = require("../../utils/response"); // added

const create = async (req) => {
  const userId = req?.user?.id || null;
  if (!userId) return sendError("Unauthorized: user not authenticated", 401);
  const slug = req?.params?.id;

  // Resolve slug → coffee_shop_id
  const shop = await coffee_shops.findOne({ where: { slug } });
  if (!shop) {
    return sendError("Coffee shop not found", 404);
  }

  // Duplicate review check (active review by same user for this shop)
  const existing = await coffee_shop_reviews.findOne({
    where: { coffee_shop_id: shop.id, user_id: userId, is_active: "Y" },
  });
  if (existing) {
    return sendError("User already submitted a review for this coffee shop", 409);
  }

  const payload = {
    ...req.body,
    user_id: userId,
    coffee_shop_id: shop.id,
    coffee_shop_slug: slug,
  };

  return await CoffeeShopReviews.create(payload);
};

const findAll = async (req) => {
  return await CoffeeShopReviews.findAll(req.query);
};

const findById = async (req) => {
  const slug = req?.params?.id;
  return await CoffeeShopReviews.findById(slug, req.query);
};

const update = async (req) => {
  const slug = req?.params?.slug;
  const data = {
    ...req.body,
    coffee_shop_slug: slug,
    updated_date: new Date(),
  };
  return await CoffeeShopReviews.update(data, req.user);
};

const remove = async (req) => {
  const reviewId = req?.params?.reviewId;
  return await CoffeeShopReviews.remove(reviewId, req.user);
};

const getReviewsByUserId = async (req) => {
  const userId = req?.user?.id || null;
  return await CoffeeShopReviews.getReviewsByUserId(userId);
};

const getAllReviews = async (req) => {
  return await CoffeeShopReviews.getAllReviews();
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
  getReviewsByUserId,
  getAllReviews
};
