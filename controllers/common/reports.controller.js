const reports = require("../../services/common/reports.service");

const create = async (req) => {
  // Merge coffee_shop_id from params into body
  const body = {
    ...req.body,
    coffee_shop_id: req.params.id,
  };

  console.log("body", body)
  return await reports.createReport(body);
};

module.exports = { create };
