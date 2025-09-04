import supabase from "../helpers/supaBaseClientConfig.js";

export function getAccessToken(request) {
  return request.cookies["sb-access-token"] || null;
}

export function getRefreshToken(request) {
  return request.cookies["sb-refresh-token"] || null;
}

export async function getUserFromAccessToken(accessToken) {
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data?.user) {
    throw new Error("Invalid or expired access token");
  }

  return data.user;
}

export async function authenticateUser(request, reply) {
  const accessToken = getAccessToken(request);
  const refreshToken = getRefreshToken(request);

  if (!accessToken) {
    throw new Error("No access token found.");
  }

  try {
    return await getUserFromAccessToken(accessToken);
  } catch (err) {
    console.warn("Access token invalid, trying refresh:", err.message);

    if (!refreshToken) {
      throw new Error("Authentication failed: No refresh token.");
    }

    // Try refreshing the session
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error || !data?.user) {
      throw new Error("Authentication failed: cannot refresh session.");
    }

    // Reset cookies
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

    return data.user;
  }
}
