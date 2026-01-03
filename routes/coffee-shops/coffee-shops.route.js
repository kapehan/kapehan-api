const controller = require("../../controllers/coffeeshop/coffeeshop.controller");
// Adjust paths as needed based on your project structure
const { authMiddleware } = require("../../middleware/middleware.js");
const { AccessLevels } = require("../../utils/accessLevels.js");

module.exports.coffeeshop = (app) => {
  // CREATE
  app.post(
    "/shop/create",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.OWNER },
    },
    controller.create
  );

  // READ (list all)
  app.get(
    "/shops",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.GUEST },
    },
    controller.findAll
  );

  // READ (single by slug)
  app.get(
    "/shop/:slug",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.GUEST },
    },
    controller.findBySlug
  );

  // UPDATE (main update)
  app.post(
    "/shop/:slug/update",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.OWNER },
    },
    controller.updateCoffeeShop
  );

  // UPDATE (status)
  app.get(
    "/shop/status/:slug/update",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.OWNER },
    },
    controller.updateCafeStatus
  );

  // READ (menu by slug)
  app.get(
    "/shop/menu/:slug",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.GUEST },
    },
    controller.findMenubyCoffeeShopSlug
  );

  // READ (featured/suggested)
  app.get(
    "/featured-coffee-shops",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.GUEST },
    },
    controller.getSuggestedCoffeeShop
  );
};
