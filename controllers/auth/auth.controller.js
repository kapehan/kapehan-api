// controllers/auth.controller.js
const { supabaseAdmin, supabaseAnon } = require("../../configs/supbase");
const mailer = require("../../services/common/mailer.service");


exports.requestPasswordReset = async (req, res) => {
  try {
    const { email, name } = req.body;

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: process.env.RESET_REDIRECT_URL // your frontend reset page
      }
    });

    if (error) throw error;
    console.log("Generated reset link data:", data);
    const resetUrl = data?.properties?.action_link ?? data?.action_link;
    if (!resetUrl) throw new Error("Reset URL was not returned");

    const html = `
      <p>Hi ${name || ""},</p>
      <p>Click the button below to reset your password:</p>
      <p><a href="${resetUrl}" style="padding:10px 18px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore it.</p>
    `;

    await mailer.sendEmail(email, name, "Reset your password", html, "Reset your password here: " + resetUrl);

    return res.code(200).send({ message: "Reset email sent successfully" });
  } catch (err) {
    console.error("Reset request failed:", err);
    return res.code(400).send({ message: err.message });
  }
};


exports.verifyResetAndChangePassword = async (req, res) => {
  try {
    const { accessToken, refreshToken, newPassword } = req.body;

    if (!accessToken || !refreshToken || !newPassword) {
      return res.code(400).send({ message: "Missing fields" });
    }

    // Set session using recovery tokens
    const { error: sessionError } = await supabaseAnon.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (sessionError) throw sessionError;

    // Now update password
    const { error: updateError } = await supabaseAnon.auth.updateUser({
      password: newPassword
    });

    if (updateError) throw updateError;

    return res.code(200).send({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Password reset failed:", err);
    return res.code(400).send({ message: err.message });
  }
};

exports.sendEmailVerification = async (req, res) => {
  try {
    const { email, name } = req.body;

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      options: {
        redirectTo: process.env.EMAIL_VERIFY_REDIRECT_URL
      }
    });

    if (error) throw error;

    const verifyUrl = data?.properties?.action_link ?? data?.action_link;
    if (!verifyUrl) throw new Error("Verification URL was not returned");

    const html = `
      <p>Hi ${name || ""},</p>
      <p>Thanks for signing up! Please verify your email by clicking the button below:</p>
      <p><a href="${verifyUrl}" style="padding:10px 18px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></p>
      <p>If you didn’t create an account, ignore this.</p>
    `;

    await mailer.sendEmail(
      email,
      name,
      "Verify your email",
      html,
      `Verify your email: ${verifyUrl}`
    );

    return res.code(200).send({ message: "Verification email sent" });

  } catch (err) {
    console.error("Verification send failed:", err);
    return res.code(400).send({ message: err.message });
  }
};


