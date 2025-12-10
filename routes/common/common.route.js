const citiesCtrl = require("../../controllers/common/cities.controller");
const vibesCtrl = require("../../controllers/common/vibes.controller");
const amenitiesCtrl = require("../../controllers/common/amenities.controller");
module.exports.coffeeshop = (app) => {
  app.get("/cities", citiesCtrl.findAll);
  app.get("/vibes", vibesCtrl.findAll);
  app.get("/amenities", amenitiesCtrl.findAll);
  app.get("/cities/shop-counts", citiesCtrl.getCityShopCounts);
};
