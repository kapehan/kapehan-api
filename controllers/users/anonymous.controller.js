const { supabaseAnon } = require("../../helpers/supabaseRoleConfig");
const { sendSuccess, sendError } = require("../../utils/response");
const { user_location_logs } = require("../../services/db.service");

// Helper: reverse geocode city from lat/lon (best-effort)
async function resolveCity(lat, lon) {
  if (!lat || !lon) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "kapehan-platform/1.0 (contact: support@kapehan.local)",
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (
      json.address?.city ||
      json.address?.town ||
      json.address?.municipality ||
      json.address?.village ||
      json.address?.state ||
      null
    );
  } catch {
    return null;
  }
}

/**
 * Generate an anonymous user session via Supabase
 * Returns session token and user metadata with role: "anonymous"
 * Stores in user_location_logs table with client metadata
 */
const createAnonymousSession = async (req, reply) => {
  try {
    // Sign in anonymously using Supabase
    const { data, error } = await supabaseAnon.auth.signInAnonymously({
      options: { data: { role: "anonymous" } },
    });

    if (error || !data?.session || !data?.user) {
      return reply.code(500).send(sendError("Failed to create anonymous session"));
    }

    // Extract client metadata from request
    const latitude = req.body?.latitude || null;
    const longitude = req.body?.longitude || null;
    let city = (req.body?.city || "").trim() || null;

    if (!city) {
      city = await resolveCity(latitude, longitude);
    }

    const userAgent = req.headers["user-agent"] || "";
    const device_type = /mobile/i.test(userAgent) ? "mobile" : /tablet/i.test(userAgent) ? "tablet" : "desktop";
    const browser = userAgent.match(/(chrome|safari|firefox|edge|opera)/i)?.[0] || "unknown";
    const os = userAgent.match(/(windows|mac|linux|android|ios)/i)?.[0] || "unknown";

    // Insert into user_location_logs (anonymous user)
    await user_location_logs.create({
      user_id: data.user.id, // anon user UUID
      is_anonymous: true, // mark as anonymous
      latitude,
      longitude,
      city,
      device_type,
      browser,
      os,
    });

    // Set cookies for the anonymous session (20 minutes max age)
    reply.setCookie("sb-access-anon-token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/",
      maxAge: 60 * 20, // 20 minutes
    });

    return reply.code(200).send(
      sendSuccess(
        {
          user: {
            id: data.user.id,
            created_at: data.user.created_at,
          }
        },
        "Anonymous session created successfully"
      )
    );
  } catch (err) {
    console.error("❌ Error creating anonymous session:", err.message);
    return reply.code(500).send(sendError("Failed to create anonymous session", err.message));
  }
};

/**
 * Get or create anonymous user (used by getUserDataController)
 * Checks for existing anon token, validates it, or creates new session
 */
const getOrCreateAnonymousUser = async (req, reply) => {
  try {
    const anonToken = req.cookies["sb-access-anon-token"];
    if (anonToken) {
      try {
        const { data: userData, error: userError } = await supabaseAnon.auth.getUser(anonToken);
        if (!userError && userData?.user) {
          const anonUserId = userData.user.id;
          const existing = await user_location_logs.findOne({ where: { user_id: anonUserId } });
          if (existing) {
            return reply.send(
              sendSuccess({ id: existing.user_id, role: "anonymous" }, "Anonymous user retrieved")
            );
          }
        }
      } catch (err) {
        console.warn("⚠️ Invalid anon token, generating new:", err.message);
      }
    }

    // Create new anonymous session
    return await createAnonymousSession(req, reply);
  } catch (err) {
    console.error("❌ Error getting/creating anonymous user:", err.message);
    return reply.code(500).send(sendError(err.message));
  }
};

/**
 * Update user location (handles both anonymous and authenticated users)
 * - Anonymous: update existing record only
 * - Authenticated: upsert (create or update)
 */
const updateUserLocation = async (req, reply) => {
  try {
    const userId = req.user?.id;
    const isAuthenticated = req.user?.isAuthenticated || false;

    if (!userId) {
      return reply.code(401).send({ isSuccess: false, message: "Token required" });
    }

    const { latitude, longitude, city } = req.body || {};
    let resolvedCity = (city || "").trim() || null;

    // Authenticated user: INSERT new row every time (log history)
    if (isAuthenticated) {
      if (!resolvedCity && latitude && longitude) {
        resolvedCity = await resolveCity(latitude, longitude);
      }

      const userAgent = req.headers["user-agent"] || "";
      const device_type = /mobile/i.test(userAgent) ? "mobile" : /tablet/i.test(userAgent) ? "tablet" : "desktop";
      const browser = userAgent.match(/(chrome|safari|firefox|edge|opera)/i)?.[0] || "unknown";
      const os = userAgent.match(/(windows|mac|linux|android|ios)/i)?.[0] || "unknown";

      // Always create new row (no update) - change user_id to non-primary key in model
      await user_location_logs.create({
        user_id: userId,
        is_anonymous: false,
        latitude: latitude || null,
        longitude: longitude || null,
        city: resolvedCity || null,
        device_type,
        browser,
        os,
      });

      console.log(`[updateUserLocation] Created new location log for authenticated user ${userId}`);
      return reply.send({ isSuccess: true, id: userId });
    }

    // Anonymous user: update only (single row per anon user)
    const existing = await user_location_logs.findOne({ where: { user_id: userId } });
    if (!existing) {
      return reply.code(404).send({ isSuccess: false, message: "Anonymous user not found" });
    }

    if (!resolvedCity) {
      const latToUse = latitude ?? existing.latitude;
      const lonToUse = longitude ?? existing.longitude;
      resolvedCity = (await resolveCity(latToUse, lonToUse)) || existing.city;
    }

    await existing.update({
      // is_anonymous remains true for anonymous users (no change needed)
      latitude: latitude ?? existing.latitude,
      longitude: longitude ?? existing.longitude,
      city: resolvedCity ?? existing.city,
    });

    return reply.send({ isSuccess: true, id: userId });
  } catch (err) {
    console.error(`[updateUserLocation] Error:`, err);
    return reply.code(500).send({ isSuccess: false, message: err.message });
  }
};

module.exports = {
  createAnonymousSession,
  getOrCreateAnonymousUser,
  updateUserLocation, // renamed from updateAnonymousUser
};
