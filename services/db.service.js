const { Sequelize } = require('sequelize');
const config = require('../configs/sql.config');
const model = require('../models');

const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: 'postgres',
  logging: false,
  timezone: '+08:00',
  port: 5432,
  define: {
    timestamps: true,
  },
  dialectOptions: {
    decimalNumbers: true,
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 1,   // ✅ important for Vercel
    min: 0,
    idle: 10000,
    acquire: 30000
  }
});

// Don't auto-authenticate here – let initDatabase() handle it
module.exports = { sequelize, ...model(sequelize) };
