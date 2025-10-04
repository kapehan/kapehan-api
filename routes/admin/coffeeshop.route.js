const coffee_shop = require("../../controllers/coffeeshop/coffeeshop.controller")
module.exports.coffeeshop = (app) => {
    app.post('/coffee-shop/create', coffee_shop.create);
    app.post('/coffee-shop', coffee_shop.find);
    app.post('/coffee-shop/:id/update', coffee_shop.update);
    app.post('/coffee-shop/:id/delete', coffee_shop._delete);
}