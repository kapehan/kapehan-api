import * as userService from "../../services/user/userService";

/**
 * @param {import('fastify').FastifyRequest} req
 * @param {import('fastify').FastifyReply} reply
 */
export async function registerUserController(req, reply) {
  try {
    const { email, password, city, username } = req.body;

    const data = await userService.registerUser(
      email,
      password,
      city,
      username
    );
    reply.send({ message: "User registered successfully", data });
  } catch (error) {
    reply.status(400).send({ error: error.message });
  }
}

export async function loginUserController(req, reply) {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return reply.status(400).send({
        error: "Email and password are required fields.",
      });
    }

    // 2. Authenticate user via Supabase
    const { isSuccess, sessionToken } = await userService.loginUser(email, password);

    if (!isSuccess) {
      return reply.status(401).send({
        error: "Login failed.",
        isSuccess: false
      });
    }

    // 3. Set HttpOnly cookie with the Supabase access_token
    reply.setCookie("sessionToken", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ⛏️ Fixed: not `true || ...`
      sameSite: "Strict",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    // 4. Return success message
    return reply.send({
      message: "Login successful",
      isSuccess: true
    });

  } catch (error) {
    console.error("Login controller error:", error);
    return reply.status(500).send({
      error: "Server error: " + error.message
    });
  }
}

export const logoutUserController = async (req, reply) => {
  try {
    // Call the logoutUser service
    await userService.logoutUser();

    // Clear the session token cookie
    reply.clearCookie("sessionToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "Strict",
      path: "/",
    });

    // Send a success response
    reply.send({
      message: "Logout successful",
      isSuccess: true,
    });
  } catch (error) {
    reply.status(500).send({ error: error.message, isSuccess: false });
  }
};

export async function getUserDataController(request, reply) {
  try {
    const userId = request.user?.id;

    const data = await userService.getUserData(userId);
    return reply.send({ userData: data });
  } catch (err) {
    console.error("getUserData exception:", err);
    return reply.code(500).send({ error: err.message });
  }
}

export async function updateUserDataController(request, reply) {
  try {
    const userId = request.user?.id;
    const { username, city } = request.body;

    if (!username && !city) {
      return reply.code(400).send({ error: "No fields provided to update." });
    }

    const updatedData = await userService.updateUserData(userId, {
      username,
      city,
    });

    return reply.send({
      message: "User data updated successfully",
      userData: updatedData, // Send the updated data
    });
  } catch (error) {
    return reply.code(500).send({ error: error.message });
  }
}