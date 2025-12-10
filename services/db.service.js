const { Sequelize } = require("sequelize");
const config = require("../configs/sql.config");
const model = require("../models"); // your models/index.js

// Initialize sequelize instance
const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: "postgres",
  timezone: "+08:00",
  port: 5432,
  define: {
    timestamps: true,
  },
  dialectOptions: {
    decimalNumbers: true,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

// Test DB connection
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Connected to database");
  })
  .catch((error) => {
    console.error("❌ Unable to connect:", error);
  });

// Initialize models
const models = model(sequelize);

// Debug log: list all model keys
console.log("✅ Models initialized:", Object.keys(models));

// Export sequelize + all models
module.exports = { sequelize, ...models };
