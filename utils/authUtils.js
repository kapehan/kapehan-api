// utils/authUtils.js
import supabase from "../helpers/supaBaseClientConfig.js";
import { AccessLevels } from "../utils/accessLevels.js";

/**
 * Authenticate user via Supabase access token from cookies.
 * Throws 401 if no token or invalid session.
 */
export async function authenticateUser(request, reply) {
  // Get tokens from cookies
  const accessToken = request.cookies?.["sb-access-token"] || null;
  const refreshToken = request.cookies?.["sb-refresh-token"] || null;

  // ❌ No cookies → immediate 401
  if (!accessToken && !refreshToken) {
    console.log("[AuthMiddleware] No tokens found in cookies");
    throw new Error("Unauthorized: Invalid session token.");
  }

  let user = null;
  let role = "anon";

  function extractRole(userObj) {
    if (!userObj) return "anon";
    if (userObj.app_metadata?.role) return userObj.app_metadata.role;
    if (Array.isArray(userObj.app_metadata?.roles) && userObj.app_metadata.roles.length > 0) {
      return userObj.app_metadata.roles.includes("admin")
        ? "admin"
        : userObj.app_metadata.roles[0];
    }
    return "user"; // default role for registered users
  }

  try {
    // Validate token via Supabase
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

    // Try refresh token if available
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

          // Reset cookies
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

  // Attach user info to request
  request.user = {
    isAuthenticated: role !== "anon",
    role,
    user,
  };

  // Role-based access control
  const requiredAccess = request.routeOptions?.config?.access || AccessLevels.GUEST;
  console.log("[AuthMiddleware] Required access for route:", requiredAccess);

  if (requiredAccess === AccessLevels.USER && !["user", "admin"].includes(role)) {
    throw new Error("User access required");
  }

  if (requiredAccess === AccessLevels.ADMIN && role !== "admin") {
    throw new Error("Admin access required");
  }

  return request.user;
};
