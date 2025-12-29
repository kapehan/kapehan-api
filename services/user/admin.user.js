const { supabaseAnon } = require("../../helpers/supabaseRoleConfig.js");
const {
  getSupabaseWithAuth,
} = require("../../helpers/supaBaseClientWithId.js");
const db = require("../db.service.js");
const { users } = db;

async function loginAdminUser(email, password) {
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
    const userId = data.user.id;
    // Query the users table for the user's role
    const userRecord = await users.findOne({ where: { id: userId } });
    if (!userRecord) {
      console.error("User not found in users table:", userId);
      throw new Error("User not found in users table.");
    }
    if (userRecord.role !== "admin") {
      console.error(
        "User privilege access is not compatible with the role:",
        userRecord.role
      );
      throw new Error(
        "User privilege access is not compatible with the role. Only admin users can log in here."
      );
    }
    console.log("data", data);
    const accessToken = data.session.access_token;
    const refreshToken = data.session.refresh_token;
    console.log("✅ Login successful");
    console.log("Access token:", accessToken);
    console.log("Refresh token:", refreshToken);
    return { isSuccess: true, accessToken, refreshToken, userId };
  } catch (err) {
    console.error("Login exception:", err);
    throw new Error("Login failed: " + err.message);
  }
}

async function getUserData(userId, accessToken) {
  try {
    console.log("userId", userId);
    if (!userId) {
      throw new Error("User ID is missing or invalid.");
    }
    const user = await users.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found or access denied by RLS.");
    }
    if (user.role !== "admin") {
      throw new Error(
        "User privilege access is not compatible with the role. Only admin users can access this resource."
      );
    }
    const userObj = user.toJSON();
    return userObj;
  } catch (err) {
    console.error("getUserData exception:", err);
    throw new Error(
      err.message || "An unknown error occurred while retrieving user data."
    );
  }
}

async function getAllUsers(req) {
  try {
    const { role, search } = req.query; // Extract role and search from query parameters

    const whereClause = {};
    if (role) {
      whereClause.role = role; // Add role filtering if provided
    }
    if (search) {
      whereClause[db.Sequelize.Op.or] = [
        { username: { [db.Sequelize.Op.iLike]: `%${search}%` } }, // Case-insensitive search for username
        { full_name: { [db.Sequelize.Op.iLike]: `%${search}%` } }, // Case-insensitive search for full_name
      ];
    }

    const userList = await users.findAll({
      attributes: ["id", "username", "full_name", "created_at", "role"], // Select specific fields
      where: whereClause, // Apply filtering based on role and search
    });

    if (!userList || userList.length === 0) {
      throw new Error("No users found.");
    }

    return userList.map((user) => user.toJSON()); // Convert Sequelize objects to plain JSON
  } catch (err) {
    console.error("getAllUsers exception:", err);
    throw new Error(
      err.message || "An unknown error occurred while fetching users."
    );
  }
}

module.exports = {
  loginAdminUser,
  getUserData,
  getAllUsers, // Export the updated function
};
