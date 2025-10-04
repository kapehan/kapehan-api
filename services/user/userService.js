/**
 * @typedef {import('@supabase/supabase-js').User} SupabaseUser
 * @typedef {import('@supabase/supabase-js').Session} SupabaseSession
 */

/**
 * @typedef {Object} RegisterResponse
 * @property {string} message
 * @property {{ user: SupabaseUser|null, session: SupabaseSession|null }} data
 */

import { supabase } from "../../configs/supabase.config.js";
import { getSupabaseWithAuth } from "../../helpers/supaBaseClientWithId.js";

export const registerUser = async (email, password, city, username) => {
  try {
    // Attempt to sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: {
            role: "user", // Optional: metadata
            display_name: username, // Add username to user metadata
          },
        },
      }
    );

    // Handle sign-up errors
    if (signUpError) {
      console.error("Sign-up error details:", signUpError); // Log full error details
      throw new Error(
        `Sign-up failed: ${signUpError.message || "Unknown error"}`
      );
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      console.error("Sign-up response missing user ID:", signUpData); // Log the response
      throw new Error("User ID not returned from sign-up");
    }

    // Insert additional user info into your own table
    const { data: insertData, error: insertError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: email,
        city: city,
        role: "user",
        username: username, // Insert username into your custom table
      });

    // Handle insert errors
    if (insertError) {
      console.error("Insert error details:", insertError); // Log full error details
      throw new Error(
        `Insert into user_table failed: ${
          insertError.message || "Unknown error"
        }`
      );
    }

    console.log("Insert success:", insertData); // Log success response
    return signUpData;
  } catch (error) {
    console.error("Error in registerUser:", error); // Log the full error object
    throw new Error(
      error.message || "An unknown error occurred during user registration"
    );
  }
};

export const loginUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
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
    const { error } = await supabase.auth.signOut();

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
  const supabaseUser = getSupabaseWithAuth(accessToken); // ✅ pass token, not id

  try {
    console.log("userId", userId);

    if (!userId) {
      throw new Error("User ID is missing or invalid.");
    }

    const { data, error } = await supabaseUser
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      throw new Error("Error retrieving user data.");
    }

    if (!data) {
      throw new Error("User not found or access denied by RLS.");
    }

    return data;
  } catch (err) {
    console.error("getUserData exception:", err);
    throw new Error(
      err.message || "An unknown error occurred while retrieving user data."
    );
  }
};

export const updateUserData = async (userId, accessToken, data) => {
  const supabaseUser = getSupabaseWithAuth(accessToken); // ✅ pass token, not id

  const { username, city } = data;

  try {
    if (!userId) {
      throw new Error("User ID is required to update user data.");
    }

    const { data: updatedData, error: tableError } = await supabaseUser
      .from("users")
      .update({
        username: username,
        city: city,
      })
      .eq("id", userId)
      .select("*");

    console.log("Query result:", { updatedData, tableError });

    if (tableError) {
      console.error("Error updating users:", tableError);
      throw new Error("Error updating user data in the database.");
    }

    if (!updatedData || updatedData.length === 0) {
      throw new Error("User not found or update failed in users.");
    }

    console.log("User data updated successfully in users:", updatedData);

    return updatedData[0]; // Return the updated user data
  } catch (err) {
    console.error("updateUserData exception:", err);
    throw new Error(
      err.message || "An unknown error occurred while updating user data."
    );
  }
};
