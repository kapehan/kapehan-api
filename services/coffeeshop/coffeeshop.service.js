const {
  users,
  coffee_shops,
  ratings,
  feedback,
  amenities,
  coffee_shop_amenities,
  vibes,
  coffee_shop_vibes,
  cities,
  opening_hours,
  sequelize, // added
  payment_method,
  menu_item,
  menu_item_price,
} = require("../db.service");
const { Op } = require("sequelize");
const dayjs = require("dayjs");
const { sendSuccess, sendError } = require("../../utils/response");
const {
  formatCoffeeShop,
  formatCoffeeShopById,
} = require("../../utils/formatResponse");
const {
  haversineKm,
  boundingBox,
  annotateAndFilterByDistance,
} = require("../../utils/geo");

// Simple in-memory cache (consider Redis for production)
const queryCache = new Map();
const CACHE_TTL = 60000; // 1 minute

function getCacheKey(key) {
  return queryCache.get(key);
}

function setCacheKey(key, value) {
  queryCache.set(key, { data: value, timestamp: Date.now() });
  setTimeout(() => queryCache.delete(key), CACHE_TTL);
}

function isCacheValid(key) {
  const cached = queryCache.get(key);
  return cached && Date.now() - cached.timestamp < CACHE_TTL;
}

const create = async (body) => {
  try {
    const data = Object.fromEntries(
      Object.entries(body).map(([k, v]) => [k, v?.value ?? v])
    );

    console.log("this is the data", data);

    // --------------------------
    // Helper to safely parse arrays or JSON strings
    // --------------------------
    const parseArrayField = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [val];
        }
      }
      return [];
    };

    const amenitiesList = parseArrayField(data.amenities);
    const vibesList = parseArrayField(data.vibes);
    const paymentMethods = parseArrayField(data.payment);
    const menuData = parseArrayField(data.menu); // ✅ use parseArrayField on menu

    let openingHours = {};
    if (typeof data.openingHours === "string") {
      try {
        openingHours = JSON.parse(data.openingHours);
      } catch {
        console.error(
          "❌ Failed to parse openingHours JSON:",
          data.openingHours
        );
        openingHours = {};
      }
    } else if (data.openingHours && typeof data.openingHours === "object") {
      openingHours = data.openingHours;
    }

    // --------------------------
    // Standard fields
    // --------------------------
    data.slug = data.name?.replace(/\s+/g, "-").toLowerCase();
    (data.mobile_number = data.mobile_number),
      (data.founded = data.founded ? dayjs(data.founded).toDate() : null);

    // --------------------------
    // Debug logs
    // --------------------------
    console.log("💡 amenitiesList:", amenitiesList);
    console.log("💡 vibesList:", vibesList);
    console.log("💡 openingHours:", openingHours);
    console.log("💡 paymentMethods:", paymentMethods);
    console.log("💡 menuData:", menuData);

    // --------------------------
    // Transaction
    // --------------------------
    const t = await sequelize.transaction();

    try {
      const coffeeShop = await coffee_shops.create(data, { transaction: t });
      const coffee_shop_id = coffeeShop.id;

      console.log("💡 Created coffee shop:", coffeeShop.toJSON());

      // --------------------------
      // Helper function for bulk create
      // --------------------------
      const bulkCreateIfNotEmpty = async (list, model, mapFn) => {
        if (list.length) {
          const items = list.map(mapFn);
          console.log(`💡 Creating ${model.name}:`, items);
          await model.bulkCreate(items, { transaction: t });
          console.log(`✅ Created ${model.name} entries`);
        } else {
          console.log(`⚠️ No entries to create for ${model.name}`);
        }
      };

      // --------------------------
      // Amenities
      // --------------------------
      await bulkCreateIfNotEmpty(
        amenitiesList,
        coffee_shop_amenities,
        (value) => ({
          coffee_shop_id,
          amenity_value: String(value),
        })
      );

      // --------------------------
      // Vibes
      // --------------------------
      await bulkCreateIfNotEmpty(vibesList, coffee_shop_vibes, (value) => ({
        coffee_shop_id,
        vibe_value: String(value).replace(/^"|"$/g, "").toLowerCase(),
      }));

      // --------------------------
      // Opening hours
      // --------------------------
      if (openingHours && Object.keys(openingHours).length) {
        const openingData = Object.entries(openingHours).map(
          ([day, { open, close, isOpen }]) => ({
            coffee_shop_id,
            day_of_week: day,
            open_time: open || null,
            close_time: close || null,
            is_closed: !isOpen,
          })
        );
        if (openingData.length) {
          console.log("💡 Creating opening hours:", openingData);
          await opening_hours.bulkCreate(openingData, { transaction: t });
          console.log("✅ Created opening hours entries");
        }
      }

      // --------------------------
      // Payment Methods
      // --------------------------
      await bulkCreateIfNotEmpty(paymentMethods, payment_method, (type) => ({
        coffee_shop_id,
        type: String(type).toLowerCase(),
      }));

      // --------------------------
      // Menu Items + Prices
      // --------------------------
      if (menuData.length) {
        // parse the first object in the array if menuData came as array of objects
        const menuObj =
          Array.isArray(menuData) && menuData.length === 1
            ? menuData[0]
            : menuData;

        const menuItemsToCreate = [];
        const pricesToLink = [];

        for (const [category, items] of Object.entries(menuObj)) {
          if (!Array.isArray(items)) continue;

          for (const item of items) {
            const hasVariants =
              Array.isArray(item.sizes) && item.sizes.length > 0;

            menuItemsToCreate.push({
              coffee_shop_id,
              name: item.name,
              description: item.description || null,
              category,
              has_variants: hasVariants,
              created_at: new Date(),
            });

            pricesToLink.push({ item, hasVariants });
          }
        }

        console.log("💡 menuItemsToCreate:", menuItemsToCreate);

        if (menuItemsToCreate.length) {
          const createdMenuItems = await menu_item.bulkCreate(
            menuItemsToCreate,
            {
              transaction: t,
              returning: true,
            }
          );

          console.log(
            "✅ Created menu items:",
            createdMenuItems.map((i) => i.toJSON())
          );

          const menuPricesToCreate = [];
          createdMenuItems.forEach((menuItem, index) => {
            const { item, hasVariants } = pricesToLink[index];

            if (hasVariants) {
              item.sizes.forEach((sizeObj) => {
                menuPricesToCreate.push({
                  menu_item_id: menuItem.id,
                  size: sizeObj.size,
                  price: parseFloat(sizeObj.price),
                });
              });
            } else if (item.price != null) {
              menuPricesToCreate.push({
                menu_item_id: menuItem.id,
                size: null,
                price: parseFloat(item.price),
              });
            }
          });

          console.log("💡 menuPricesToCreate:", menuPricesToCreate);

          if (menuPricesToCreate.length) {
            await menu_item_price.bulkCreate(menuPricesToCreate, {
              transaction: t,
            });
            console.log("✅ Created menu item prices");
          } else {
            console.log("⚠️ No menu item prices to insert");
          }
        }
      } else {
        console.log("⚠️ No menu data to insert");
      }

      await t.commit();
      console.log("✅ Transaction committed successfully");
      return { coffee_shop_id };
    } catch (err) {
      await t.rollback();
      console.error("❌ Error inside transaction:", err);
      throw err;
    }
  } catch (err) {
    console.error("❌ Error creating coffee shop:", err);
    throw err;
  }
};

const findAll = async (query, reply) => {
  try {
    const normalizedQuery = Object.fromEntries(
      Object.entries(query).map(([key, value]) => [
        key.toLowerCase(),
        typeof value === "string" ? value.toLowerCase() : value,
      ])
    );
    console.log(normalizedQuery.vibes);
    // Normalize list-like query params (single string, CSV string, array, or scalar)
    const toArray = (val) => {
      if (val == null) return null;
      if (Array.isArray(val))
        return val.map((s) => String(s).trim()).filter(Boolean);
      if (typeof val === "string")
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      return [String(val)].filter(Boolean);
    };

    // vibes is singular (string) — normalize like city
    const rawVibe =
      typeof normalizedQuery.vibes === "string" &&
      normalizedQuery.vibes.trim() !== ""
        ? normalizedQuery.vibes.trim()
        : typeof normalizedQuery.vibe === "string" &&
          normalizedQuery.vibe.trim() !== ""
        ? normalizedQuery.vibe.trim()
        : null;
    const vibeNormalizedUnderscore = rawVibe
      ? rawVibe.toLowerCase().replace(/\s+/g, "_")
      : null;
    const vibeNormalizedSpace = rawVibe
      ? rawVibe.toLowerCase().replace(/_/g, " ")
      : null;

    const where = {};
    if (normalizedQuery.search) {
      where.name = { [Op.iLike]: `%${normalizedQuery.search}%` };
    }
    if (normalizedQuery.minrating) {
      where.rating = { [Op.gte]: parseFloat(normalizedQuery.minrating) };
    }
    if (normalizedQuery.city) {
      const normalizedCity = String(normalizedQuery.city)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_");
      where.city = normalizedCity;
    }

    // Geo params
    const lat = query.lat != null ? parseFloat(query.lat) : null;
    const lng = query.lng != null ? parseFloat(query.lng) : null;
    const radiusKm = query.radiusKm != null ? parseFloat(query.radiusKm) : null;
    const sortByDistance = isFinite(lat) && isFinite(lng);

    // Build filters for junction tables (amenities can be CSV/array)
    const amenityFilter = toArray(
      normalizedQuery.amenities ?? normalizedQuery.amenity
    );

    // Include selection (lighter by default; opt-in via include=...)
    const includeParam =
      typeof query.include === "string" ? query.include.toLowerCase() : "";
    const includeSet = new Set(
      includeParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    const includeAll = includeSet.has("all");

    const include = [];

    // City info
    if (
      includeAll ||
      normalizedQuery.city ||
      includeSet.has("city") ||
      includeSet.has("city_info")
    ) {
      include.push({
        model: cities,
        as: "city_info",
        required: !!normalizedQuery.city,
        attributes: ["city_name", "city_value"],
      });
    }

    // Amenities: always include; apply where only if filter provided
    include.push({
      model: coffee_shop_amenities,
      as: "amenities",
      required: !!(amenityFilter && amenityFilter.length), // <-- key change: required true if filtering
      where:
        amenityFilter && amenityFilter.length
          ? { amenity_value: { [Op.in]: amenityFilter } }
          : undefined,
      attributes: ["amenity_value"],
      include: [
        {
          model: amenities,
          as: "amenity",
          attributes: ["amenity_name", "amenity_value"],
        },
      ],
    });

    // Vibes: include always; when filtering by vibe, require the join so only shops with matching vibe are returned
    include.push({
      model: coffee_shop_vibes,
      as: "vibes",
      required: !!rawVibe, // was false; make it required when a filter exists
      where: rawVibe
        ? {
            [Op.or]: [
              { vibe_value: vibeNormalizedUnderscore },
              { vibe_value: vibeNormalizedSpace },
            ],
          }
        : undefined,
      attributes: ["vibe_value"],
      include: [
        { model: vibes, as: "vibe", attributes: ["vibe_name", "vibe_value"] },
      ],
    });

    // Opening hours: opt-in
    if (includeAll || includeSet.has("opening_hours")) {
      include.push({
        model: opening_hours,
        as: "opening_hours",
        required: false,
        attributes: ["day_of_week", "open_time", "close_time", "is_closed"],
      });
    }

    // Payment methods: opt-in
    if (
      includeAll ||
      includeSet.has("payment_methods") ||
      includeSet.has("payment")
    ) {
      include.push({
        model: payment_method,
        as: "payment_methods",
        required: false,
        attributes: ["type"],
      });
    }

    // Ensure we have today's opening_hours for ordering open shops first (Asia/Manila)
    const now = dayjs().tz("Asia/Manila");
    const todayLower = now.format("dddd").toLowerCase();
    const nowTime = now.format("HH:mm:ss");

    // Attach today's opening_hours to include (merge if already present)
    let ohInc = include.find((i) => i.as === "opening_hours");
    if (!ohInc) {
      include.push({
        model: opening_hours,
        as: "opening_hours",
        required: false,
        attributes: ["day_of_week", "open_time", "close_time", "is_closed"],
        // case-insensitive equality
        where: { day_of_week: { [Op.iLike]: now.format("dddd") } },
      });
    } else {
      ohInc.required = false;
      ohInc.attributes = [
        "day_of_week",
        "open_time",
        "close_time",
        "is_closed",
      ];
      ohInc.where = {
        ...(ohInc.where || {}),
        day_of_week: { [Op.iLike]: now.format("dddd") },
      };
    }

    // Pagination params
    const limit = parseInt(query.limit) || 20;
    const page = parseInt(query.page) || 1;
    const offset = (page - 1) * limit;

    // Generate cache key from query params
    const cacheKey = JSON.stringify(query);

    // Check cache first (skip for geo queries which are dynamic)
    if (!sortByDistance && isCacheValid(cacheKey)) {
      const cached = getCacheKey(cacheKey);
      if (cached) {
        console.log("📦 Cache hit for findAll");
        return cached.data;
      }
    }

    // If we have geo, apply a coarse bounding box to reduce rows
    if (sortByDistance && radiusKm && isFinite(radiusKm)) {
      const bbox = boundingBox(lat, lng, radiusKm);
      where.latitude = { [Op.between]: [bbox.minLat, bbox.maxLat] };
      where.longitude = { [Op.between]: [bbox.minLon, bbox.maxLon] };
    }

    // Helper to compute openNow for a row (uses today's opening_hours)
    const isOpenNow = (row) => {
      const hours = (row.opening_hours || []).filter(
        (h) => (h.day_of_week || "").toLowerCase() === todayLower
      );
      if (!hours.length) return false;
      return hours.some(
        (h) =>
          !h.is_closed &&
          String(h.open_time) <= nowTime &&
          String(h.close_time) >= nowTime
      );
    };

    // Branch: no lat/lng -> original paginated query, but order open-first in SQL
    if (!sortByDistance) {
      // If filtering by amenities, group by coffee_shop id and require all amenities
      let group = undefined;
      let having = undefined;
      if (amenityFilter && amenityFilter.length) {
        group = ['coffee_shops.id'];
        having = sequelize.literal(
          `COUNT(DISTINCT("amenities"."amenity_value")) = ${amenityFilter.length}`
        );
      }

      const rows = await coffee_shops.findAll({
        where,
        include,
        limit,
        offset,
        distinct: true,
        subQuery: false,
        raw: false,
        order: [
          [
            sequelize.literal(
              `CASE WHEN "opening_hours"."is_closed" = false AND "opening_hours"."open_time" <= '${nowTime}' AND "opening_hours"."close_time" >= '${nowTime}' THEN 0 ELSE 1 END`
            ),
            "ASC",
          ],
          ["rating", "DESC"],
          ["name", "ASC"],
        ],
        group,
        having,
      });

      // If grouped, flatten result
      const resultRows = Array.isArray(rows) && rows[0] && rows[0].dataValues
        ? rows.map(r => r)
        : rows;

      const formattedRows = resultRows.map(formatCoffeeShop);
      const pageInfo = {
        total: formattedRows.length,
        page,
        limit,
        totalPages: Math.ceil(formattedRows.length / limit),
      };

      const response = sendSuccess(
        formattedRows,
        "Coffee shops fetched successfully",
        pageInfo
      );

      setCacheKey(cacheKey, response);
      return response;
    }

    // Branch: with lat/lng (no caching, dynamic results)
    const rows = await coffee_shops.findAll({
      where,
      include,
      distinct: true,
      subQuery: false,
    });

    let annotated = annotateAndFilterByDistance(rows, lat, lng, radiusKm).map(
      (a) => ({
        ...a,
        openNow: isOpenNow(a.row),
      })
    );

    // Open-first, then distance asc
    annotated.sort((a, b) => {
      if (a.openNow !== b.openNow) return a.openNow ? -1 : 1;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    const total = annotated.length;
    const paged = annotated.slice(offset, offset + limit);
    const formattedRows = paged.map(({ row, distanceKm }) => {
      const f = formatCoffeeShop(row);
      f.distanceKm = distanceKm;
      return f;
    });
    const pageInfo = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return sendSuccess(
      formattedRows,
      "Coffee shops fetched successfully",
      pageInfo
    );
  } catch (error) {
    console.error("❌ Error fetching coffee shops:", error);
    return sendError(`Failed to fetch coffee shops: ${error.message}`);
  }
};

const findBySlug = async (params, reply) => {
  try {
    const { slug } = params;

    if (!slug) {
      return sendError("Slug is required");
    }

    // Check cache
    const cacheKey = `shop:${slug}`;
    if (isCacheValid(cacheKey)) {
      const cached = getCacheKey(cacheKey);
      if (cached) {
        console.log("📦 Cache hit for findBySlug");
        return cached.data;
      }
    }

    // Find a single coffee shop where slug matches
    const shop = await coffee_shops.findOne({
      where: { slug },
      include: [
        {
          model: coffee_shop_amenities,
          as: "amenities",
          required: false,
          include: [
            {
              model: amenities,
              as: "amenity",
              attributes: ["amenity_name", "amenity_value"],
            },
          ],
        },
        {
          model: coffee_shop_vibes,
          as: "vibes",
          required: false,
          include: [
            {
              model: vibes,
              as: "vibe",
              attributes: ["vibe_name", "vibe_value"],
            },
          ],
        },
        { model: opening_hours, as: "opening_hours", required: false },
        { model: cities, as: "city_info", required: false },
        {
          model: payment_method,
          as: "payment_methods",
          required: false,
          attributes: ["type"],
        },
      ],
    });

    if (!shop) {
      return sendError("Coffee shop not found", 404);
    }

    const formattedShop = formatCoffeeShopById(shop);
    const response = sendSuccess(
      formattedShop,
      "Coffee shop fetched successfully"
    );

    // Cache response
    setCacheKey(cacheKey, response);
    return response;
  } catch (error) {
    console.error("❌ Error fetching coffee shop:", error);
    return sendError(`Failed to fetch coffee shop: ${error.message}`);
  }
};

const findMenubyCoffeeShopSlug = async (params, reply) => {
  try {
    const { slug } = params;
    if (!slug) return sendError("Slug is required");

    const shop = await coffee_shops.findOne({
      where: { slug },
      attributes: ["id", "name", "slug"],
      include: [
        {
          model: menu_item,
          as: "menuItems", // match model alias
          required: false,
          attributes: ["id", "name", "description", "category", "has_variants"],
          include: [
            {
              model: menu_item_price,
              as: "prices", // match model alias
              required: false,
              attributes: ["size", "price"],
            },
          ],
        },
      ],
    });

    if (!shop) return sendError("Coffee shop not found", 404);

    const items = (shop.menuItems || []).map((mi) => ({
      id: mi.id,
      name: mi.name,
      description: mi.description,
      category: mi.category,
      has_variants: !!mi.has_variants,
      variants: (mi.prices || [])
        .filter((p) => p.size != null)
        .map((p) => ({ size: p.size, price: Number(p.price) })),
      price: (() => {
        const base = (mi.prices || []).find((p) => p.size == null);
        return base ? Number(base.price) : null;
      })(),
    }));

    const menuByCategory = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    return sendSuccess({ menu: menuByCategory }, "Menu fetched successfully");
  } catch (error) {
    console.error("❌ Error fetching menu:", error);
    return sendError(`Failed to fetch menu: ${error.message}`);
  }
};

const getSuggestedCoffeeShops = async (query, reply) => {
  try {
    const normalizedQuery = Object.fromEntries(
      Object.entries(query).map(([key, value]) => [
        key.toLowerCase(),
        typeof value === "string" ? value.toLowerCase() : value,
      ])
    );

    // Prepare city filter: accept either city_value ("quezon_city") or city_name ("quezon city")
    let cityFilter = null;
    if (normalizedQuery.city) {
      const normalizedCityValue = String(normalizedQuery.city)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_");
      const normalizedCityName = String(normalizedQuery.city)
        .toLowerCase()
        .trim();
      cityFilter = { value: normalizedCityValue, name: normalizedCityName };
    }

    const where = {};
    if (normalizedQuery.minrating) {
      where.rating = { [Op.gte]: parseFloat(normalizedQuery.minrating) };
    }
    if (cityFilter) {
      // Direct filter on coffee_shops.city (stored as value, e.g., "quezon_city")
      where.city = cityFilter.value;
    }

    // Build include, add city_info when filtering by city or requested
    const includeParam =
      typeof query.include === "string" ? query.include.toLowerCase() : "";
    const includeSet = new Set(
      includeParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    const include = [];
    if (cityFilter || includeSet.has("city") || includeSet.has("city_info")) {
      include.push({
        model: cities,
        as: "city_info",
        required: false,
        attributes: ["city_name", "city_value"],
      });
    }

    // Always include amenities and vibes (like findAll)
    include.push({
      model: coffee_shop_amenities,
      as: "amenities",
      required: false,
      attributes: ["amenity_value"],
      include: [
        {
          model: amenities,
          as: "amenity",
          attributes: ["amenity_name", "amenity_value"],
        },
      ],
    });
    include.push({
      model: coffee_shop_vibes,
      as: "vibes",
      required: false,
      attributes: ["vibe_value"],
      include: [
        {
          model: vibes,
          as: "vibe",
          attributes: ["vibe_name", "vibe_value"],
        },
      ],
    });

    // Fetch candidate pool ordered by rating
    const poolLimit = parseInt(query.poolLimit) || 50;
    const limitRaw = parseInt(query.limit);
    const suggestionsCount = Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(limitRaw, 50))
      : 3;

    // 1) Get city-filtered candidates first
    const cityCandidates = await coffee_shops.findAll({
      where,
      include,
      order: [
        ["rating", "DESC"],
        ["name", "ASC"],
      ],
      limit: poolLimit,
      subQuery: false,
      raw: false,
    });

    // 2) If fewer than requested AND a city filter was applied, fetch a global fallback pool
    let globalCandidates = [];
    if (cityCandidates.length < suggestionsCount && !!cityFilter) {
      const globalWhere = { ...where };
      delete globalWhere.city; // remove city constraint
      globalCandidates = await coffee_shops.findAll({
        where: globalWhere,
        include, // keep same include (optional)
        order: [
          ["rating", "DESC"],
          ["name", "ASC"],
        ],
        limit: poolLimit,
        subQuery: false,
        raw: false,
      });
    }

    // Combine pools while avoiding duplicates
    const combinedMap = new Map();
    for (const r of cityCandidates) combinedMap.set(r.id, r);
    for (const r of globalCandidates)
      if (!combinedMap.has(r.id)) combinedMap.set(r.id, r);
    const candidates = Array.from(combinedMap.values());

    if (!candidates.length) {
      return sendSuccess([], "No suggested coffee shops");
    }

    // Rating-weighted random sample of 'suggestionsCount'
    const items = candidates.map((row) => ({
      row,
      rating: Number(row.rating) || 0,
    }));
    const epsilon = 0.1;
    const pickWeighted = (arr, k) => {
      const picked = [];
      const pool = arr.slice();
      for (let i = 0; i < k && pool.length; i++) {
        const total = pool.reduce((s, it) => s + (it.rating + epsilon), 0);
        let r = Math.random() * total;
        let idx = 0;
        for (; idx < pool.length; idx++) {
          r -= pool[idx].rating + epsilon;
          if (r <= 0) break;
        }
        const chosen = pool.splice(Math.min(idx, pool.length - 1), 1)[0];
        picked.push(chosen);
      }
      return picked;
    };

    let suggested = pickWeighted(items, suggestionsCount);

    // If fewer than requested due to small pool, fill randomly from remaining
    if (suggested.length < suggestionsCount) {
      const remaining = items.filter(
        (it) => !suggested.some((p) => p.row.id === it.row.id)
      );
      while (suggested.length < suggestionsCount && remaining.length) {
        suggested.push(
          remaining.splice(Math.floor(Math.random() * remaining.length), 1)[0]
        );
      }
    }

    const formatted = suggested.map(({ row }) => formatCoffeeShop(row));
    return sendSuccess(formatted, "Suggested coffee shops");
  } catch (error) {
    console.error("❌ Error fetching suggested coffee shops:", error);
    return sendError(
      `Failed to fetch suggested coffee shops: ${error.message}`
    );
  }
};

module.exports = {
  create,
  findAll,
  findBySlug,
  findMenubyCoffeeShopSlug,
  getSuggestedCoffeeShops,
};
