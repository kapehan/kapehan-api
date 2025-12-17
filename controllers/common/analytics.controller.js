const analytics = require("../../services/common/general.service");

const getGeneralAnalytics = async (req) => {
  return await analytics.getGeneralAnalytics(req.query);
};

module.exports = { getGeneralAnalytics };
