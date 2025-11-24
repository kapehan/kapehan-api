const { supabaseAnon } = require("../../helpers/supabaseRoleConfig");
const { sendSuccess, sendError } = require("../../utils/response");
const { anonymous_user } = require("../../services/db.service");

// Helper: reverse geocode city from lat/lon (best-effort)
async function resolveCity(lat, lon) {
  if (!lat || !lon) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "kapehan-platform/1.0 (contact: support@kapehan.local)" },
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
 * Stores in anonymous_user table with client metadata
 */
const createAnonymousSession = async (req, reply) => {
  try {
    // Sign in anonymously using Supabase
    const { data, error } = await supabaseAnon.auth.signInAnonymously({
      options: {
        data: {
          role: "anonymous", // custom metadata
        },
      },
    });

    if (error) {
      console.error("❌ Failed to create anonymous session:", error.message);
      return reply.code(500).send(sendError("Failed to create anonymous session", error.message));
    }

    if (!data?.session || !data?.user) {
      return reply.code(500).send(sendError("Failed to create anonymous session: no session returned"));
    }

    // Extract client metadata from request
    const latitude = req.body?.latitude || null;
    const longitude = req.body?.longitude || null;
    let city = (req.body?.city || "").trim() || null;

    if (!city) {
      city = await resolveCity(latitude, longitude);
    }

    // Parse user agent (simple extraction; consider using a library like `ua-parser-js` for production)
    const userAgent = req.headers["user-agent"] || "";
    const device_type = /mobile/i.test(userAgent) ? "mobile" : /tablet/i.test(userAgent) ? "tablet" : "desktop";
    const browser = userAgent.match(/(chrome|safari|firefox|edge|opera)/i)?.[0] || "unknown";
    const os = userAgent.match(/(windows|mac|linux|android|ios)/i)?.[0] || "unknown";

    // Insert into anonymous_user table
    await anonymous_user.create({
      anon_user_uuid: data.user.id,
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
            role: data.user.user_metadata?.role || "anonymous",
            created_at: data.user.created_at,
          },
          session: {
            access_token: data.session.access_token,
            expires_at: data.session.expires_at,
          },
          metadata: {
            latitude,
            longitude,
            city,
            device_type,
            browser,
            os,
          },
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
    // 1) Try existing anonymous token
    const anonToken = req.cookies["sb-access-anon-token"];
    if (anonToken) {
      try {
        // Verify token via Supabase
        const { data: userData, error: userError } = await supabaseAnon.auth.getUser(anonToken);
        if (!userError && userData?.user) {
          const anonUserId = userData.user.id;
          const existing = await anonymous_user.findOne({ where: { anon_user_uuid: anonUserId } });
          if (existing) {
            return reply.send(
              sendSuccess(
                {
                  id: existing.anon_user_uuid,
                  role: "anonymous",
                  city: existing.city,
                  device_type: existing.device_type,
                  browser: existing.browser,
                  os: existing.os,
                },
                "Anonymous user retrieved"
              )
            );
          }
        }
      } catch (err) {
        console.warn("⚠️ Invalid anon token, generating new:", err.message);
      }
    }

    // 2) Create new anonymous session (delegate to createAnonymousSession)
    return await createAnonymousSession(req, reply);
  } catch (err) {
    console.error("❌ Error getting/creating anonymous user:", err.message);
    return reply.code(500).send(sendError(err.message));
  }
};

/**
 * Update anonymous user location
 * Requires valid anonymous token
 */
const updateAnonymousUser = async (req, reply) => {
  try {
    const anonId = req.user?.id;
    if (!anonId) {
      return reply.code(401).send(sendError("Anonymous token required"));
    }
    const existing = await anonymous_user.findOne({ where: { anon_user_uuid: anonId } });
    if (!existing) {
      return reply.code(404).send(sendError("Anonymous user not found"));
    }

    const { latitude, longitude, city } = req.body || {};
    let resolvedCity = (city || "").trim() || null;

    // Prefer provided city; if absent try reverse geocode from new or existing lat/lon
    if (!resolvedCity) {
      const latToUse = latitude ?? existing.latitude;
      const lonToUse = longitude ?? existing.longitude;
      resolvedCity = await resolveCity(latToUse, lonToUse) || existing.city;
    }

    const updatePayload = {
      latitude: latitude ?? existing.latitude,
      longitude: longitude ?? existing.longitude,
      city: resolvedCity ?? existing.city,
    };

    const [affected, rows] = await anonymous_user.update(updatePayload, {
      where: { anon_user_uuid: anonId },
      returning: true,
    });

    if (!affected || !rows?.length) {
      return reply.code(500).send(sendError("Failed to update anonymous user"));
    }

    return reply.send(
      sendSuccess(
        {
          id: rows[0].anon_user_uuid,
          latitude: rows[0].latitude,
          longitude: rows[0].longitude,
          city: rows[0].city,
        },
        "Anonymous user location updated"
      )
    );
  } catch (err) {
    return reply.code(500).send(sendError(err.message || "Internal server error"));
  }
};

module.exports = {
  createAnonymousSession,
  getOrCreateAnonymousUser,
  updateAnonymousUser,
};
