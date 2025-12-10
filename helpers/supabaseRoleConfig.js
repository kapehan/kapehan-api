require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Warn instead of throwing to avoid serverless init crashes
if (!SUPABASE_URL) {
  console.warn("⚠️ SUPABASE_URL is not set. Supabase clients will be unavailable.");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is not set. Service client will be unavailable.");
}
if (!SUPABASE_ANON_KEY) {
  console.warn("⚠️ SUPABASE_ANON_KEY is not set. Anonymous client will be unavailable.");
}

// Lazy init: only create clients when envs exist
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const supabaseAnon = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const bucket = {
  public: process.env.STORAGE_PUBLIC,
  private: process.env.STORAGE_PRIVATE,
};

// or if you also need bucket:
module.exports = { supabase, bucket, supabaseAnon };
