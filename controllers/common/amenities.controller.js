const amenities = require("../../services/common/amenities.service");

const findAll = async (req) => {
  return await amenities.findAll(req.query);
};

module.exports = { findAll };
