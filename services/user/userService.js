/**
 * @typedef {import('@supabase/supabase-js').User} SupabaseUser
 * @typedef {import('@supabase/supabase-js').Session} SupabaseSession
 */

/**
 * @typedef {Object} RegisterResponse
 * @property {string} message
 * @property {{ user: SupabaseUser|null, session: SupabaseSession|null }} data
 */

import { supabaseAnon } from "../../helpers/supabaseRoleConfig.js";
import { getSupabaseWithAuth } from "../../helpers/supaBaseClientWithId.js";
import db from "../db.service.js";
const { users } = db;

export const registerUser = async (email, password, city, username, name, gender) => {
  console.log(name)
  try {
    // Attempt to sign up the user
    const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp(
      {
        email,
        password,
        options: {
          data: {
            role: "user",
            display_name: username,
          },
        },
      }
    );

    // Handle sign-up errors
    if (signUpError) {
      console.error("Sign-up error details:", signUpError);
      throw new Error(
        `Sign-up failed: ${signUpError.message || "Unknown error"}`
      );
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      console.error("Sign-up response missing user ID:", signUpData);
      throw new Error("User ID not returned from sign-up");
    }

    // Insert using Sequelize (works with kapehan schema)
    let insertData;
    try {
      insertData = await users.create({
        id: userId,
        email: email,
        city: city,
        role: "user",
        full_name: name,
        username: username,
        gender: gender,
      });
    } catch (insertError) {
      console.error("Insert error details:", insertError);

      // Attempt to delete the Supabase user if possible
      try {
        await supabaseAnon.auth.admin.deleteUser(userId);
        console.log("Rolled back Supabase user creation due to DB insert failure.");
      } catch (deleteError) {
        console.error("Failed to rollback Supabase user:", deleteError);
      }

      throw new Error(
        `Insert into user_table failed: ${insertError.message || "Unknown error"}`
      );
    }

    console.log("✅ Insert success:", insertData.toJSON());

    // Return tokens for immediate login
    const accessToken = signUpData.session?.access_token;
    const refreshToken = signUpData.session?.refresh_token;

    return {
      isSuccess: true,
      accessToken,
      refreshToken,
      userId,
    };
  } catch (error) {
    console.error("Error in registerUser:", error);
    throw new Error(
      error.message || "An unknown error occurred during user registration"
    );
  }
};

export const loginUser = async (email, password) => {
  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login error:", error);
      throw new Error(error.message || "An error occurred during login.");
    }

    if (!data || !data.session || !data.user) {
      console.error("Unexpected login response:", data);
      throw new Error("Login failed: Invalid response from server.");
    }

    console.log("data", data);

    const accessToken = data.session.access_token;
    const refreshToken = data.session.refresh_token;
    const userId = data.user.id;

    console.log("✅ Login successful");
    console.log("Access token:", accessToken);
    console.log("Refresh token:", refreshToken);

    return {
      isSuccess: true,
      accessToken,
      refreshToken,
      userId,
    };
  } catch (err) {
    console.error("Login exception:", err);
    throw new Error("Login failed: " + err.message);
  }
};

export const logoutUser = async () => {
  try {
    const { error } = await supabaseAnon.auth.signOut();

    if (error) {
      console.error("Supabase logout error:", error);
      throw new Error(error.message || "An error occurred during logout.");
    }

    console.log("Logout successful.");
    return { isSuccess: true, message: "Logout successful" };
  } catch (err) {
    console.error("Logout exception:", err);
    throw new Error("Logout failed: " + err.message);
  }
};

export const getUserData = async (userId, accessToken) => {
  try {
    console.log("userId", userId);

    if (!userId) {
      throw new Error("User ID is missing or invalid.");
    }

    // Use Sequelize model for kapehan.users
    const user = await users.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error("User not found or access denied by RLS.");
    }

    return user.toJSON();
  } catch (err) {
    console.error("getUserData exception:", err);
    throw new Error(
      err.message || "An unknown error occurred while retrieving user data."
    );
  }
};

export const updateUserData = async (userId, accessToken, data) => {
  const { username, city } = data;

  try {
    if (!userId) {
      throw new Error("User ID is required to update user data.");
    }

    // Use Sequelize model for kapehan.users
    const [affected] = await users.update(
      { username, city },
      { where: { id: userId } }
    );

    if (!affected) {
      throw new Error("User not found or update failed in users.");
    }

    const updatedUser = await users.findOne({ where: { id: userId } });

    if (!updatedUser) {
      throw new Error("User not found after update.");
    }

    console.log("User data updated successfully in users:", updatedUser.toJSON());
    return updatedUser.toJSON();
  } catch (err) {
    console.error("updateUserData exception:", err);
    throw new Error(
      err.message || "An unknown error occurred while updating user data."
    );
  }
};

export const refreshSession = async (refreshToken) => {
  if (!refreshToken) return { data: null, error: "No refresh token" };

  try {
    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data?.session) {
      console.error("❌ Supabase refresh error:", error);
      return { data: null, error };
    }

    const { session } = data;

    return {
      data: {
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: session.user,
        },
      },
      error: null,
    };
  } catch (err) {
    console.error("⚠️ refreshSession error:", err);
    return { data: null, error: err.message };
  }
};
