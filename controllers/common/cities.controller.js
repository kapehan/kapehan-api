const cities = require("../../services/common/cities.service");

const findAll = async (req) => {
  return await cities.findAll(req.query);
};

module.exports = { findAll };
