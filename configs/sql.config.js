require('dotenv').config();
const config = {}

config.port = process.env.DB_PORT 
config.host = process.env.DB_HOST 
config.user = process.env.DB_USER 
config.password = process.env.DB_PASS 
config.database = process.env.DB_NAME 
config.schema = process.env.DB_SCHEMA 

module.exports = config
