const { vibes } = require("../db.service");
const { sendSuccess, sendError } = require("../../utils/response");

const findAll = async () => {
  try {
    const allVibes = await vibes.findAll({
      attributes: ["vibe_name", "vibe_value"], // Select only these columns
    });
    return sendSuccess(allVibes, "Vibes fetched successfully");
  } catch (error) {
    console.error("❌ Error fetching Vibes:", error);
    return sendError(error.message, "Failed to fetch cities");
  }
};

module.exports = { findAll };
