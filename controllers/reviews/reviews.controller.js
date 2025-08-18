const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const CoffeeShopReviews = require("../../services/reviews/reviews.service");

const create = async (req, reply) => {
  const result = await CoffeeShopReviews.create(req.body);
  return reply.send(result);
};

const findAll = async (req) => {
  return await CoffeeShopReviews.findAll(req.query);
};

const findById = async (req) => {
  const data = await CoffeeShopReviews.findById(req.params.id);
  if (!data) throw new Error("Reviews not found.");
  return data;
};

const update = async (req) => {
  const data = {
    ...req.body,
    updated_date: new Date(),
  };

  const updated = await CoffeeShopReviews.update(req.params.id, data);
  if (!updated) throw new Error("Reviews not found.");
  return updated;
};

const remove = async (req) => {

  console.log("this is the one who deleted", req.body.deleted_by)
  const data = {
    status: "deleted",
    updated_date: new Date(),
    updated_by: req.body.deleted_by,
  };

  const deleted = await CoffeeShopReviews.update(req.params.id, data);

  if (!deleted) {
    throw new Error("Client Company not found.");
  }

  return deleted;
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
};
