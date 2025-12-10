const { cities, coffee_shops, sequelize } = require("../db.service");
const { sendSuccess, sendError } = require("../../utils/response");

const findAll = async () => {
  try {
    const allCities = await cities.findAll({
      attributes: ["city_name", "city_value"], // Select only these columns
    });
    return sendSuccess(allCities, "Cities fetched successfully");
  } catch (error) {
    console.error("❌ Error fetching cities:", error);
    return sendError(error.message, "Failed to fetch cities");
  }
};

// Returns number of coffee shops per city_value ordered by count desc
const getCityShopCounts = async () => {
  try {
    const counts = await coffee_shops.findAll({
      attributes: [
        "city",
        [sequelize.fn("COUNT", sequelize.col("*")), "count"],
      ],
      group: ["city"],
      order: [[sequelize.literal("count"), "DESC"]],
      raw: true,
      limit: 6, // limit to top 6
    });

    const cityValues = counts.map((c) => c.city).filter(Boolean);
    const labels = await cities.findAll({
      where: cityValues.length ? { city_value: cityValues } : undefined,
      attributes: ["city_name", "city_value"],
      raw: true,
    });

    const labelMap = new Map(labels.map((l) => [l.city_value, l.city_name]));
    const result = counts.map((c) => ({
      city_name: labelMap.get(c.city) || c.city,
      count: Number(c.count) || 0,
    }));

    return sendSuccess(result, "City shop counts fetched successfully");
  } catch (error) {
    console.error("❌ Error fetching city shop counts:", error);
    return sendError(`Failed to fetch city shop counts: ${error.message}`);
  }
};

module.exports = {
  findAll,
  getCityShopCounts,
};
