// utils/authUtils.js
const { supabaseAnon } = require("../helpers/supabaseRoleConfig.js");
const { AccessLevels } = require("../utils/accessLevels.js");
const { sendError } = require("./response.js");
const db = require("../services/db.service.js");
const { users } = db;

// Helper: get user using provided access token via anon client
async function getUserFromToken(token) {
  if (!token) return { data: null, error: new Error("No access token") };
  try {
    return await supabaseAnon.auth.getUser(token);
  } catch (e) {
    return { data: null, error: e };
  }
}

// Helper: refresh session safely with refresh token via anon client
async function refreshSession(accessToken, refreshToken) {
  if (!refreshToken) return { data: null, error: new Error("No refresh token") };
  try {
    if (supabaseAnon?.auth?.setSession) {
      return await supabaseAnon.auth.setSession({
        access_token: accessToken || "",
        refresh_token: refreshToken,
      });
    }
    if (supabaseAnon?.auth?.refreshSession) {
      return await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });
    }
    return { data: null, error: new Error("Supabase auth missing refresh capability") };
  } catch (e) {
    return { data: null, error: e };
  }
}

async function authenticateUser(request, reply) {
  // 1) Determine required access first
  const requiredAccess = request.routeOptions?.config?.access || AccessLevels.GUEST;

  // 2) GUEST routes allow anyone (optional token tracking)
  if (requiredAccess === AccessLevels.GUEST) {
    const anonToken = request.cookies?.["sb-access-anon-token"] || null;
    const accessToken = request.cookies?.["sb-access-token"] || null;

    // Try anonymous token first (optional)
    if (anonToken) {
      try {
        const { data, error } = await supabaseAnon.auth.getUser(anonToken);
        if (!error && data?.user) {
          request.user = { isAuthenticated: false, role: "guest", id: data.user.id, user: data.user };
          return;
        }
      } catch (err) {
        console.warn("⚠️ Invalid anonymous token:", err.message);
      }
    }

    // Try authenticated token (optional)
    if (accessToken) {
      try {
        const { data, error } = await getUserFromToken(accessToken);
        if (!error && data?.user) {
          request.user = { isAuthenticated: true, role: "user", id: data.user.id, user: data.user };
          return;
        }
      } catch (err) {
        console.warn("⚠️ Invalid access token:", err.message);
      }
    }

    // No token or invalid: allow as pure guest
    request.user = { isAuthenticated: false, role: "guest", id: null, user: null };
    return;
  }

  // 3) Enforce auth for non-guest routes
  const accessToken = request.cookies?.["sb-access-token"] || null;
  const refreshToken = request.cookies?.["sb-refresh-token"] || null;

  if (!accessToken && !refreshToken) {
    const payload = sendError("Unauthorized: No session token.");
    reply.code(401).send(payload);
    return;
  }

  let user = null;
  let dbRole = "anon";

  // Helper: fetch role from users table
  async function getRoleFromUsersTable(userId) {
    if (!userId) return "anon";
    const userRecord = await users.findOne({ where: { id: userId } });
    return userRecord?.role || "user";
  }

  // 3a) Try access token if present
  if (accessToken) {
    const { data, error } = await getUserFromToken(accessToken);
    if (!error && data?.user) {
      user = data.user;
      dbRole = await getRoleFromUsersTable(user.id);
    }
  }

  // 3b) If we still don't have a user and we have a refresh token, try refresh
  if (!user && refreshToken) {
    const { data, error } = await refreshSession(accessToken, refreshToken);
    if (!error && data?.user && data?.session) {
      user = data.user;
      dbRole = await getRoleFromUsersTable(user.id);

      // Only now issue new cookies (access and refresh) after a SUCCESSFUL refresh
      reply
        .setCookie("sb-access-token", data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
          path: "/",
          maxAge: 60 * 60, // 1 hour
        })
        .setCookie("sb-refresh-token", data.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "Strict",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
    } else {
      // Refresh failed: do NOT set any cookies
      const payload = sendError("Unauthorized: Invalid session token.");
      reply.code(401).send(payload);
      return;
    }
  }

  // If we still don't have a user here, reject
  if (!user) {
    const payload = sendError("Unauthorized: Invalid access token.");
    reply.code(401).send(payload);
    return;
  }

  // 4) Attach user and enforce role requirements
  request.user = {
    isAuthenticated: dbRole !== "anon",
    role: dbRole,
    id: user?.id || null,
    user,
  };

  switch (requiredAccess) {
    case AccessLevels.USER:
      if (!["user", "admin", "coffee_shop_owner"].includes(dbRole)) {
        reply.code(403).send(sendError("User access required"));
        return;
      }
      return;
    case AccessLevels.OWNER:
      if (!["coffee_shop_owner", "admin"].includes(dbRole)) {
        reply.code(403).send(sendError("Owner access required"));
        return;
      }
      return;
    case AccessLevels.ADMIN:
      if (dbRole !== "admin") {
        reply.code(403).send(sendError("Admin access required"));
        return;
      }
      return;
    default:
      return;
  }
}

module.exports = { authenticateUser };
