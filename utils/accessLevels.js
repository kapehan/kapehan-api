// utils/accessLevels.js
const AccessLevels = {
  GUEST: "guest",        // no token required
  ANONYMOUS: "anonymous",// requires anon OR user token
  USER: "user",
  OWNER: "owner",
  ADMIN: "admin",
};

module.exports = { AccessLevels };
