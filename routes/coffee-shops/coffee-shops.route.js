const controller = require("../../controllers/coffeeshop/coffeeshop.controller");
// Adjust paths as needed based on your project structure
const { authMiddleware } = require("../../middleware/middleware.js");
const { AccessLevels } = require("../../utils/accessLevels.js");

module.exports.coffeeshop = (app) => {
  app.post("/shop/create", controller.create);

  app.get(
    "/shops",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.GUEST },
    },
    controller.findAll
  );

  app.get(
    "/shop/:slug",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.GUEST },
    },
    controller.findBySlug
  );

  app.get(
    "/shop/menu/:slug",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.GUEST },
    },
    controller.findMenubyCoffeeShopSlug
  );
};
