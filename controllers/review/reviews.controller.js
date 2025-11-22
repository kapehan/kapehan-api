const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const CoffeeShopReviews = require("../../services/reviews/reviews.service");
const { coffee_shops } = require("../../services/db.service"); // to resolve slug

const create = async (req) => {
  const userId = req?.user?.id || null;
  const slug = req?.params?.id;

  // Resolve slug → coffee_shop_id
  const shop = await coffee_shops.findOne({ where: { slug } });
  if (!shop) {
    return { isSuccess: false, message: "Coffee shop not found", data: null };
  }

  const payload = {
    ...req.body,
    user_id: userId,
    coffee_shop_id: shop.id, // UUID
    coffee_shop_slug: slug,   // keep for denormalization if needed
  };

  console.log("this is the payload", payload)
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
  return await CoffeeShopReviews.update(data, req.user); // service pulls user id from auth
};

const remove = async (req) => {
  const reviewId = req?.params?.reviewId;
  console.log("reviewId", reviewId);
  return await CoffeeShopReviews.remove(reviewId, req.user);
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
};
