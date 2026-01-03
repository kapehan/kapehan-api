const { Sequelize } = require("sequelize");
const config = require("../configs/sql.config");
const model = require("../models");

const isServerless = !!process.env.VERCEL;

const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: "postgres",
  timezone: "+08:00",
  port: config.port ?? 5432, // set pooled port here if using Supabase pooling (e.g., 6543)
  define: { timestamps: true },
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
    ssl: { require: true, rejectUnauthorized: false },
  },
});

const models = model(sequelize);

// Debug log
console.log("✅ Models initialized:", Object.keys(models));

module.exports = { sequelize, ...models };
