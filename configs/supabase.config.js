require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("❌ Missing Supabase environment variables");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const bucket = {
  public: process.env.STORAGE_PUBLIC,
  private: process.env.STORAGE_PRIVATE,
};


// or if you also need bucket:
module.exports = { supabase, bucket };
