// utils/authUtils.js
const supabase = require("../helpers/supaBaseClientConfig.js");
const { AccessLevels } = require("./accessLevels.js");

/**
 * Authenticate user via Supabase access token from cookies.
 * Throws 401 if no token or invalid session.
 * Supports roles: anon, user, admin, coffee_shop_owner
 */
async function authenticateUser(request, reply) {
  const accessToken = request.cookies?.["sb-access-token"] || null;
  const refreshToken = request.cookies?.["sb-refresh-token"] || null;

  if (!accessToken && !refreshToken) {
    console.log("[AuthMiddleware] No tokens found in cookies");
    throw new Error("Unauthorized: Invalid session token.");
  }

  let user = null;
  let role = "anon";

  // Determine role from Supabase user object
  function extractRole(userObj) {
    if (!userObj) return "anon";

    if (userObj.app_metadata?.role) return userObj.app_metadata.role;

    if (Array.isArray(userObj.app_metadata?.roles) && userObj.app_metadata.roles.length > 0) {
      if (userObj.app_metadata.roles.includes("admin")) return "admin";
      if (userObj.app_metadata.roles.includes("coffee_shop_owner")) return "coffee_shop_owner";
      return "user";
    }

    return "user";
  }

  try {
    if (accessToken) {
      const { data, error } = await supabase.auth.getUser(accessToken);
      if (error || !data?.user) throw new Error("Invalid access token");

      user = data.user;
      role = extractRole(user);
      console.log("[AuthMiddleware] Access token role:", role);
    } else {
      throw new Error("No access token provided");
    }
  } catch (err) {
    console.warn("[AuthMiddleware] Access token invalid:", err.message);

    if (refreshToken) {
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error && data?.user) {
          user = data.user;
          role = extractRole(user);

          console.log("[AuthMiddleware] Refreshed token role:", role);

          reply
            .setCookie("sb-access-token", data.session.access_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "Strict",
              path: "/",
              maxAge: 60 * 60,
            })
            .setCookie("sb-refresh-token", data.session.refresh_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "Strict",
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
            });
        } else {
          throw new Error("Unauthorized: Invalid session token.");
        }
      } catch (refreshErr) {
        console.warn("[AuthMiddleware] Refresh failed:", refreshErr.message);
        throw new Error("Unauthorized: Invalid session token.");
      }
    } else {
      throw new Error("Unauthorized: Invalid session token.");
    }
  }

  request.user = {
    isAuthenticated: role !== "anon",
    role,
    user,
  };

  const requiredAccess = request.routeOptions?.config?.access || AccessLevels.GUEST;
  console.log("[AuthMiddleware] Required access for route:", requiredAccess);

  switch (requiredAccess) {
    case AccessLevels.GUEST:
      return request.user;
    case AccessLevels.USER:
      if (!["user", "admin", "coffee_shop_owner"].includes(role)) {
        throw new Error("User access required");
      }
      return request.user;
    case AccessLevels.OWNER:
      if (role !== "coffee_shop_owner") {
        throw new Error("Owner access required");
      }
      return request.user;
    case AccessLevels.ADMIN:
      if (role !== "admin") {
        throw new Error("Admin access required");
      }
      return request.user;
    default:
      return request.user;
  }
}

module.exports = { authenticateUser };
