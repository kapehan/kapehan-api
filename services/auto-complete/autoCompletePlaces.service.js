const axios = require("axios");
const { sendSuccess, sendError } = require("../../utils/response");
const { recent_user_location_search } = require("../db.service");
const { Op } = require("sequelize");

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
const GEOAPIFY_URL = process.env.GEOAPIFY_URL;

const findAll = async (query, reply) => {
  try {
    const text = (query.search || "").trim();
    if (!text) return sendError("Missing required 'search' query parameter");

    // 1) Try DB first (case-insensitive match on address)
    const existing = await recent_user_location_search.findAll({
      where: { address: { [Op.iLike]: `%${text}%` } },
      order: [["created_at", "DESC"]],
      limit: parseInt(query.limit) || 10,
      raw: true,
    });

    if (existing.length) {
      return sendSuccess(
        existing.map((r) => ({
          lat: r.lat,
          lon: r.lon,
          postcode: r.postcode,
          address: r.address,
          city: r.city,
        })),
        "Places autocomplete fetched from cache"
      );
    }

    // 2) Fallback to Geoapify
    const params = {
      text,
      apiKey: GEOAPIFY_API_KEY,
      limit: query.limit || 10,
      lang: query.lang || "en",
      filter: "countrycode:ph", // restrict to Philippines
    };
    const response = await axios.get(GEOAPIFY_URL, { params });
    const features = response.data?.features ?? [];

    const results = features.map((f) => ({
      lat: f.properties.lat,
      lon: f.properties.lon,
      postcode: f.properties.postcode || null,
      address: f.properties.formatted,
      city: f.properties.city || null,
    }));

    // 3) Async save to DB (avoid duplicates via lat+lon exact match)
    await Promise.all(
      results.map(async (r) => {
        const exists = await recent_user_location_search.findOne({
          where: { lat: r.lat, lon: r.lon },
          raw: true,
        });
        if (!exists) {
          await recent_user_location_search.create({
            lat: r.lat,
            lon: r.lon,
            postcode: r.postcode,
            address: r.address,
            city: r.city,
            // created_at defaults to NOW()
          });
        }
      })
    );

    return sendSuccess(results, "Places autocomplete fetched from Geoapify");
  } catch (error) {
    console.error("❌ Error fetching places autocomplete:", error);
    return sendError(`Failed to fetch places autocomplete: ${error.message}`);
  }
};

module.exports = { findAll };
