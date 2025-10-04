const coffee_shop = require("../../controllers/coffeeshop/coffeeshop.controller")
const { authMiddleware } = require("../../middleware/middleware.js");
const { AccessLevels } = require("../../utils/accessLevels.js");

module.exports.coffeeshop = (app) => {
    app.post('/coffee-shop/create',
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.ADMIN }, // Only admin can access
    }, coffee_shop.create);
    app.post('/coffee-shop',
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.ADMIN }, // Only admin can access
    }, coffee_shop.find);
    app.post('/coffee-shop/:id/update',
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.ADMIN }, // Only admin can access
    }, coffee_shop.update);
    app.post('/coffee-shop/:id/delete',
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.ADMIN }, // Only admin can access
    }, coffee_shop._delete);
}