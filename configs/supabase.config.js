require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role in backend
);

const bucket = {
  public: process.env.STORAGE_PUBLIC,
  private: process.env.STORAGE_PRIVATE
}

module.exports = {supabase, bucket};
