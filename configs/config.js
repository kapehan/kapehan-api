 require('dotenv').config();
module.exports = {
    port: process.env.PORT,
    auth_secret: process.env.SUPABASE_AUTH_SECRET
}