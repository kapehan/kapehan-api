// services/users/users.service.js
const { supabase } = require("../../configs/supabase.config.js");
const { getSupabaseWithAuth } = require("../../helpers/supaBaseClientWithId.js");

/**
 * Register a new user
 */
const registerUser = async (email, password, city, username) => {
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
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

    if (signUpError) {
      console.error("Sign-up error details:", signUpError);
      throw new Error(signUpError.message || "Sign-up failed");
    }

    const userId = signUpData.user?.id;
    if (!userId) throw new Error("User ID not returned from sign-up");

    const { data: insertData, error: insertError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email,
        city,
        role: "user",
        username,
      });

    if (insertError) {
      console.error("Insert error details:", insertError);
      throw new Error(insertError.message || "Insert into user table failed");
    }

    return signUpData;
  } catch (err) {
    console.error("Error in registerUser:", err);
    throw new Error(err.message || "Unknown error during registration");
  }
};

/**
 * Login a user
 */
const loginUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login error:", error);
      throw new Error(error.message || "Login failed");
    }

    if (!data || !data.session || !data.user) {
      console.error("Unexpected login response:", data);
      throw new Error("Login failed: Invalid response");
    }

    return {
      isSuccess: true,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      userId: data.user.id,
    };
  } catch (err) {
    console.error("Login exception:", err);
    throw new Error("Login failed: " + err.message);
  }
};

/**
 * Logout a user
 */
const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase logout error:", error);
      throw new Error(error.message || "Logout failed");
    }

    return { isSuccess: true, message: "Logout successful" };
  } catch (err) {
    console.error("Logout exception:", err);
    throw new Error("Logout failed: " + err.message);
  }
};

/**
 * Get user data by ID
 */
const getUserData = async (userId, accessToken) => {
  const supabaseUser = getSupabaseWithAuth(accessToken);

  try {
    if (!userId) throw new Error("User ID is missing or invalid.");

    const { data, error } = await supabaseUser
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      throw new Error("Error retrieving user data");
    }

    if (!data) throw new Error("User not found or access denied");

    return data;
  } catch (err) {
    console.error("getUserData exception:", err);
    throw new Error(err.message || "Unknown error while retrieving user data");
  }
};

/**
 * Update user data
 */
const updateUserData = async (userId, accessToken, data) => {
  const supabaseUser = getSupabaseWithAuth(accessToken);
  const { username, city } = data;

  try {
    if (!userId) throw new Error("User ID is required to update user data");

    const { data: updatedData, error: tableError } = await supabaseUser
      .from("users")
      .update({ username, city })
      .eq("id", userId)
      .select("*");

    if (tableError) {
      console.error("Error updating users:", tableError);
      throw new Error("Error updating user data in database");
    }

    if (!updatedData || updatedData.length === 0) {
      throw new Error("User not found or update failed");
    }

    return updatedData[0];
  } catch (err) {
    console.error("updateUserData exception:", err);
    throw new Error(err.message || "Unknown error while updating user data");
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserData,
  updateUserData,
};
