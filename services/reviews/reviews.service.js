const { CoffeeShopReviews } = require("../db.service");
const { Op } = require("sequelize");

const create = async (data) => {
  const created = await CoffeeShopReviews.create(data);
  return created.toJSON();
};

const findAll = async (query = {}) => {
  const where = {};

  if (query.search) {
    where.customer_name = {
      [Op.iLike]: `%${query.search}%`,
    };
  }

  let order;
  if (query.sortBy) {
    const sortBy = query.sortBy.split(",");
    const direction = query.direction?.split(",") || ["ASC"];

    order = sortBy.map((field, index) => [
      field,
      (direction[index] || direction[0] || "ASC").toUpperCase(),
    ]);
  }

  const limit = parseInt(query.limit) || 10;
  const page = parseInt(query.page) || 1;
  const offset = (page - 1) * limit;

  const { rows, count } = await CoffeeShopReviews.findAndCountAll({
    where,
    limit,
    offset,
    ...(order && { order }),
  });

  return {
    results: rows.map((item) => item.toJSON()),
    pageInfo: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};

const findById = async (_id) => {
  const found = await CoffeeShopReviews.findByPk(_id);
  if (!found) return null;
  return found.toJSON();
};

const update = async (_id, data) => {
  const [_, [updated]] = await CoffeeShopReviews.update(data, {
    where: { _id },
    returning: true,
  });

  return updated.toJSON();
};

const remove = async (_id) => {
  return await CoffeeShopReviews.destroy({ where: { _id } });
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
};
