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

    // Build filters for junction tables
    const amenityFilter = normalizedQuery.amenities
      ? normalizedQuery.amenities.split(",").map((s) => s.trim()).filter(Boolean)
      : null;
    const vibeFilter = normalizedQuery.vibes
      ? normalizedQuery.vibes.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

    // Include selection (lighter by default; opt-in via include=...)
    const includeParam = typeof query.include === "string" ? query.include.toLowerCase() : "";
    const includeSet = new Set(includeParam.split(",").map((s) => s.trim()).filter(Boolean));
    const includeAll = includeSet.has("all");

    const include = [];

    // City info: only when filtering by city or explicitly requested
    if (includeAll || normalizedQuery.city || includeSet.has("city") || includeSet.has("city_info")) {
      include.push({
        model: cities,
        as: "city_info",
        required: !!normalizedQuery.city,
        attributes: ["city_name", "city_value"],
      });
    }

    // Amenities: include only if filtering or explicitly requested
    const wantAmenities = includeAll || (amenityFilter && amenityFilter.length) || includeSet.has("amenities");
    if (wantAmenities) {
      include.push({
        model: coffee_shop_amenities,
        as: "amenities",
        required: !!(amenityFilter && amenityFilter.length),
        where: amenityFilter ? { amenity_value: { [Op.in]: amenityFilter } } : undefined,
        attributes: ["amenity_value"],
        // Include metadata only when include contains amenities_meta or "all"
        include: (includeAll || includeSet.has("amenities_meta"))
          ? [{ model: amenities, as: "amenity", attributes: ["amenity_name", "amenity_value"] }]
          : undefined,
      });
    }

    // Vibes: include only if filtering or explicitly requested
    const wantVibes = includeAll || (vibeFilter && vibeFilter.length) || includeSet.has("vibes");
    if (wantVibes) {
      include.push({
        model: coffee_shop_vibes,
        as: "vibes",
        required: !!(vibeFilter && vibeFilter.length),
        where: vibeFilter ? { vibe_value: { [Op.in]: vibeFilter } } : undefined,
        attributes: ["vibe_value"],
        include: (includeAll || includeSet.has("vibes_meta"))
          ? [{ model: vibes, as: "vibe", attributes: ["vibe_name", "vibe_value"] }]
          : undefined,
      });
    }

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
    if (includeAll || includeSet.has("payment_methods") || includeSet.has("payment")) {
      include.push({
        model: payment_method,
        as: "payment_methods",
        required: false,
        attributes: ["type"],
      });
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

    // Branch: no lat/lng -> original paginated query
    if (!sortByDistance) {
      const total = await coffee_shops.count({ where, distinct: true, include });
      const rows = await coffee_shops.findAll({
        where,
        include,
        limit,
        offset,
        distinct: true,
        subQuery: false, // avoid expensive subqueries with includes
        raw: false,
      });

      const formattedRows = rows.map(formatCoffeeShop);
      const pageInfo = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
      
      const response = sendSuccess(
        formattedRows,
        "Coffee shops fetched successfully",
        pageInfo
      );
      
      // Cache the response
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

    let annotated = annotateAndFilterByDistance(rows, lat, lng, radiusKm);
    annotated.sort((a, b) => {
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
    const pageInfo = { total, page, limit, totalPages: Math.ceil(total / limit) };

    return sendSuccess(formattedRows, "Coffee shops fetched successfully", pageInfo);
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
    const response = sendSuccess(formattedShop, "Coffee shop fetched successfully");
    
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

    return sendSuccess(
      { menu: menuByCategory },
      "Menu fetched successfully"
    );
  } catch (error) {
    console.error("❌ Error fetching menu:", error);
    return sendError(`Failed to fetch menu: ${error.message}`);
  }
};

module.exports = { create, findAll, findBySlug, findMenubyCoffeeShopSlug };
