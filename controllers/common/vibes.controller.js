const vibes = require("../../services/common/vibes.service");

const findAll = async (req) => {
  return await vibes.findAll(req.query);
};

module.exports = { findAll };
