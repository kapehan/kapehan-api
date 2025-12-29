const {
  coffee_shops,
  coffee_shop_reviews,
  users,
} = require("../../services/db.service");
const { sendSuccess, sendError } = require("../../utils/response");

const getDashboardAnalytics = async (req, res) => {
  try {
    // Total coffee shops (registered shops)
    const totalShops = await coffee_shops.count();

    // Total reviews
    const totalReviews = await coffee_shop_reviews.count();

    // Reviews created in the last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const newReviewsThisWeek = await coffee_shop_reviews.count({
      where: {
        created_at: { $gte: weekAgo },
      },
    });

    // Total users
    const totalUsers = await users.count();

    // Users registered in the last 7 days
    const newUsersThisWeek = await users.count({
      where: {
        created_at: { $gte: weekAgo },
      },
    });

    return res.send(
      sendSuccess(
        {
          coffee_shops: totalShops,
          total_reviews: totalReviews,
          new_reviews_this_week: newReviewsThisWeek,
          total_users: totalUsers,
          new_users_this_week: newUsersThisWeek,
        },
        "Dashboard analytics fetched successfully"
      )
    );
  } catch (error) {
    console.error("❌ Error fetching dashboard analytics:", error);
    return res
      .status(500)
      .send(sendError(error.message, "Failed to fetch dashboard analytics"));
  }
};

const getShopStatusAnalytics = async (req, res) => {
  try {
    // Total shops
    const totalShops = await coffee_shops.count();

    // Active shops (assuming status: 'active')
    const activeShops = await coffee_shops.count({
      where: { status: "active" },
    });

    // Pending shops (assuming status: 'pending')
    const pendingShops = await coffee_shops.count({
      where: { status: "pending" },
    });

    // Average rating (across all reviews)
    const ratings = await coffee_shop_reviews.findAll({
      attributes: ["rating"],
    });
    let avgRating = 0;
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
      avgRating = sum / ratings.length;
      avgRating = Math.round(avgRating * 100) / 100; // round to 2 decimals
    }

    return res.send(
      sendSuccess(
        {
          total_shops: totalShops,
          active_shops: activeShops,
          pending_shops: pendingShops,
          avg_rating: avgRating,
        },
        "Shop status analytics fetched successfully"
      )
    );
  } catch (error) {
    console.error("❌ Error fetching shop status analytics:", error);
    return res
      .status(500)
      .send(sendError(error.message, "Failed to fetch shop status analytics"));
  }
};

module.exports = { getDashboardAnalytics, getShopStatusAnalytics };
