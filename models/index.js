const fs = require('fs');
const path = require('path');

module.exports = (sequelize) => {
    const models = {};

    fs.readdirSync(__dirname)
        .filter(file => file.endsWith('.model.js'))
        .forEach(file => {
            const modelDef = require(path.join(__dirname, file));
            const model = modelDef(sequelize);
            models[model.name] = model; // 
        });
    const {
        coffee_shop,
        coffee_shop_amenities,
        coffee_shop_vibe,
        opening_hours,
        amenities,
        vibes,
    } = models;

    if (coffee_shop && opening_hours) {
        coffee_shop.hasMany(opening_hours, { foreignKey: 'coffee_shop_uuid' });
        opening_hours.belongsTo(coffee_shop, { foreignKey: 'coffee_shop_uuid' });
    }

    if (coffee_shop && coffee_shop_amenities) {
        coffee_shop.hasMany(coffee_shop_amenities, { foreignKey: 'coffee_shop_uuid' });
        coffee_shop_amenities.belongsTo(coffee_shop, { foreignKey: 'coffee_shop_uuid' });
    }

    if (coffee_shop && coffee_shop_vibe) {
        coffee_shop.hasMany(coffee_shop_vibe, { foreignKey: 'coffee_shop_uuid' });
        coffee_shop_vibe.belongsTo(coffee_shop, { foreignKey: 'coffee_shop_uuid' });
    }

    if (coffee_shop_amenities && amenities) {
        coffee_shop_amenities.belongsTo(amenities, { foreignKey: 'amenities_uuid' });
        amenities.hasMany(coffee_shop_amenities, { foreignKey: 'amenities_uuid' });
    }

    if (coffee_shop_vibe && vibes) {
        coffee_shop_vibe.belongsTo(vibes, { foreignKey: 'vibe_uuid' });
        vibes.hasMany(coffee_shop_vibe, { foreignKey: 'vibe_uuid' });
    }
    
    return models;
};
