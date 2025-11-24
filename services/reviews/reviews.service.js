const { coffee_shop_reviews, coffee_shops, users } = require("../db.service"); // added coffee_shops
const { Op } = require("sequelize");
const { sendSuccess, sendError } = require("../../utils/response");

const create = async (data) => {
  try {
    const created = await coffee_shop_reviews.create(data);
    return sendSuccess(created.toJSON(), "Review created successfully");
  } catch (error) {
    return sendError(`Failed to create review: ${error.message}`);
  }
};

// Fetch reviews by coffee_shop_slug (NOT primary key)
// Default limit = 10; if ?limit=20 -> fetch all; else use provided limit
const findById = async (coffee_shop_slug, query = {}) => {
  try {
    if (!coffee_shop_slug)
      return sendError("coffee_shop_slug is required", 400);

    const parsedLimit = parseInt(query.limit, 10);
    let limit = 10;
    if (!isNaN(parsedLimit)) {
      limit = parsedLimit === 20 ? null : parsedLimit;
    }

    const { rows, count } = await coffee_shop_reviews.findAndCountAll({
      where: { coffee_shop_slug },
      order: [["created_at", "DESC"]],
      ...(limit !== null ? { limit } : {}),
      include: [
        {
          model: users,
          as: "user", // matches association alias
          attributes: ["id", "full_name", "username"], // select user fields
        },
      ],
    });

    // Flatten user fields to the top-level (no nested `user` object)
    const results = rows.map((r) => {
      const json = r.toJSON();
      if (json.user) {
        json.fullname = json.user.full_name;
        json.username = json.user.username;
        // user_id is already at top-level; remove nested user object
        delete json.user;
      }
      return json;
    });

    return sendSuccess(results, "Reviews fetched successfully", {
      total: count,
      page: 1,
      limit: limit === null ? count : limit,
    });
  } catch (error) {
    return sendError(`Failed to fetch reviews: ${error.message}`);
  }
};

// Update the review of the user (coffee_shop_slug + user_id)
const update = async (data, auth) => {

  console.log("data", data)
  try {
    const coffee_shop_slug = data?.coffee_shop_slug;
    const userId = auth?.id || auth?.user?.id || null;
    if (!coffee_shop_slug) return sendError("coffee_shop_slug is required", 400);
    if (!userId) return sendError("user_id is required", 400);

    // Remove identity fields from update payload
    const {
      coffee_shop_slug: _ignoreSlug,
      coffee_shop_id,
      user_id, // ignore any incoming user_id in body
      id,
      ...updateData
    } = data;

    const [affected, rows] = await coffee_shop_reviews.update(updateData, {
      where: { coffee_shop_slug, user_id: userId, is_active: "Y" },
      returning: true,
    });

    if (!affected || !rows?.length) return sendError("Review not found", 404);
    return sendSuccess(rows[0].toJSON(), "Review updated successfully");
  } catch (error) {
    return sendError(`Failed to update review: ${error.message}`);
  }
};

// Soft delete by review primary key id (optionally scoped to authenticated user)
const remove = async (reviewId, auth = null) => {
  try {
    if (!reviewId) return sendError("reviewId is required", 400);

    // Extract user id (middleware sets request.user.id)
    const userId = auth?.id || auth?.user?.id || null;

    const where = { id: reviewId, is_active: "Y" };
    if (userId) where.user_id = userId;

    const [affected, rows] = await coffee_shop_reviews.update(
      { is_active: "N" },
      { where, returning: true }
    );

    if (!affected || !rows?.length) return sendError("Review not found", 404);

    return sendSuccess(rows[0].toJSON(), "Review deleted successfully");
  } catch (error) {
    return sendError(`Failed to remove review: ${error.message}`);
  }
};

module.exports = {
  create,
  findById,
  update,
  remove,
};
