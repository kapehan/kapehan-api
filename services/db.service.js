const { Sequelize } = require('sequelize');
const config = require('../configs/sql.config');
const model = require('../models')
const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: 'postgres',
  logging: false,
  timezone: '+08:00',
  alter: false,
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
  }
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Service connected to SupaBase');
  })
  .catch((error) => {
    console.error('Unable to connect: ', error);
  });

module.exports = { sequelize, ...model(sequelize) };