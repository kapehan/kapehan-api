const cities = require("../../services/common/cities.service");

const findAll = async (req) => {
  return await cities.findAll(req.query);
};

const getCityShopCounts = async (req) => {
  return await cities.getCityShopCounts();
};

module.exports = { findAll, getCityShopCounts };
