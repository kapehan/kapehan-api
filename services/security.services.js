require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function getTokenExpiry(accessToken) {
  const payload = JSON.parse(
    Buffer.from(accessToken.split(".")[1], "base64").toString()
  );
  return payload.exp * 1000; // Convert to ms
}

// Login with email/password
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, session: data.session, user: data.user };
}

// Verify JWT token (used as Fastify middleware)
async function verifyToken(token) {
  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return null;
    }

    return data.user;
  } catch (err) {
    return null;
  }
}

async function maybeRefreshToken(accessToken, refreshToken) {
  const now = Date.now();
  const expiry = getTokenExpiry(accessToken);

  const minutesLeft = (expiry - now) / (1000 * 60);

  if (minutesLeft > 5) {
    return { refreshed: false, accessToken };
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    refreshed: true,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: data.user,
  };
}

module.exports = {
  login,
  verifyToken,
  maybeRefreshToken,
};
