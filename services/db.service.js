const { Sequelize } = require("sequelize");
const config = require("../configs/sql.config");
const model = require("../models"); // your models/index.js

const isServerless = !!process.env.VERCEL;

// Initialize sequelize instance with a conservative pool (serverless: max 1)
const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: "postgres",
  timezone: "+08:00",
  port: config.port ?? 5432, // prefer configured port (use pooled port if you set it)
  define: {
    timestamps: true,
  },
  pool: {
    max: isServerless ? 1 : 5,
    min: isServerless ? 0 : 1,
    idle: 10000,
    acquire: 20000,
    evict: 1000,
  },
  dialectOptions: {
    decimalNumbers: true,
    keepAlive: true,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

// Initialize models
const models = model(sequelize);

// Debug log: list all model keys
console.log("✅ Models initialized:", Object.keys(models));

// Export sequelize + all models
module.exports = { sequelize, ...models };
