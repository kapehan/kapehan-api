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

    return models;
};
