const { amenities } = require("../db.service");
const { sendSuccess, sendError } = require("../../utils/response");

const findAll = async () => {
  try {
    const allAmenities = await amenities.findAll({
      attributes: ["amenity_name", "amenity_value"], // Select only these columns
    });
    return sendSuccess(allAmenities, "Amenities fetched successfully");
  } catch (error) {
    console.error("❌ Error fetching Amenities:", error);
    return sendError(error.message, "Failed to fetch cities");
  }
};

module.exports = { findAll };
