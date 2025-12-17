const { coffee_shops, coffee_shop_reviews, cities } = require("../db.service");
const { sendSuccess, sendError } = require("../../utils/response");


const getGeneralAnalytics = async () => {
  try {
    const cityCount = await cities.count();
    const activeCoffeeShopCount = await coffee_shops.count({
      where: { status: "active" },
    });
    const activeReviewCount = await coffee_shop_reviews.count({
      where: { is_active: 'Y' },
    });

    return sendSuccess(
      {
        cities: cityCount,
        active_coffee_shops: activeCoffeeShopCount,
        reviews: activeReviewCount,
      },
      "General analytics counts fetched successfully"
    );
  } catch (error) {
    console.error("❌ Error fetching general analytics:", error);
    return sendError(error.message, "Failed to fetch general analytics");
  }
};

module.exports = { getGeneralAnalytics };
