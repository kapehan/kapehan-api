const menuCtrl = require("../../controllers/menu/menu.controller");
const { authMiddleware } = require("../../middleware/middleware.js");
const { AccessLevels } = require("../../utils/accessLevels.js");

module.exports.coffeeshop = (app) => {
  app.post(
    "/shop/menu/:id",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.OWNER },
    },
    menuCtrl.create
  );
  app.post(
    "/shop/menu/item/:id",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.OWNER },
    },
    menuCtrl.update
  );
  app.get(
    "/shop/menu/item/:id",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.OWNER },
    },
    menuCtrl.toggleMenuStatus
  );
  // READ (menu by slug)
  app.get(
    "/shop/menus/:slug",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.OWNER },
    },
    menuCtrl.findMenubyCoffeeShopSlug
  );
};
