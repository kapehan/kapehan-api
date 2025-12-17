const citiesCtrl = require("../../controllers/common/cities.controller");
const vibesCtrl = require("../../controllers/common/vibes.controller");
const amenitiesCtrl = require("../../controllers/common/amenities.controller");
const analyticsCtrl = require("../../controllers/common/analytics.controller");
const reportCtrl = require("../../controllers/common/reports.controller")
module.exports.coffeeshop = (app) => {
  app.get("/cities", citiesCtrl.findAll);
  app.get("/vibes", vibesCtrl.findAll);
  app.get("/amenities", amenitiesCtrl.findAll);
  app.get("/cities/shop-counts", citiesCtrl.getCityShopCounts);
  app.get("/analytics", analyticsCtrl.getGeneralAnalytics);
  app.post("/coffee-shop/:id/report", reportCtrl.create);
};
