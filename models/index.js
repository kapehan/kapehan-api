const fs = require("fs");
const path = require("path");

module.exports = (sequelize) => {
  const models = {};
  const loaded = [];
  const failed = [];

  fs.readdirSync(__dirname)
    .filter((file) => file.endsWith(".model.js"))
    .forEach((file) => {
      try {
        const modelDef = require(path.join(__dirname, file));

        if (typeof modelDef !== "function" && typeof modelDef !== "object") {
          throw new Error(`Expected function or object export, got ${typeof modelDef}`);
        }

        const result = typeof modelDef === "function" ? modelDef(sequelize) : modelDef(sequelize);

        // case: single model
        if (result && result.name) {
          models[result.name] = result;
          loaded.push(result.name);
          console.log(`✅ Loaded model: ${result.name} (${file})`);
        }

        // case: multiple models (object of models)
        else if (result && typeof result === "object") {
          for (const [key, mdl] of Object.entries(result)) {
            if (mdl && mdl.name) {
              models[mdl.name] = mdl;
              loaded.push(mdl.name);
              console.log(`✅ Loaded model: ${mdl.name} (${file})`);
            } else {
              throw new Error(`Invalid model "${key}" in file ${file}`);
            }
          }
        } else {
          throw new Error(`File "${file}" did not return a valid Sequelize model`);
        }
      } catch (err) {
        failed.push(file);
        console.error(`❌ Failed to load model from file "${file}"`);
        console.error(err.message);
      }
    });

  console.log("✅ Models initialized:", loaded);
  if (failed.length) {
    console.warn("⚠️ Models failed to load:", failed);
  }

  return models;
};