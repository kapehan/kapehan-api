const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const formatCoffeeShop = (shop) => {
  const now = dayjs().tz("Asia/Manila");
  const today = now.format("dddd"); // e.g., "Monday"
  let isOpen = false;

  // ✅ Determine if shop is currently open
  if (shop.opening_hours && shop.opening_hours.length > 0) {
    const todayHours = shop.opening_hours.find((h) => h.day_of_week === today);

    if (
      todayHours &&
      !todayHours.is_closed &&
      todayHours.open_time &&
      todayHours.close_time
    ) {
      const open = dayjs.tz(
        `${now.format("YYYY-MM-DD")}T${todayHours.open_time}`,
        "Asia/Manila"
      );
      const close = dayjs.tz(
        `${now.format("YYYY-MM-DD")}T${todayHours.close_time}`,
        "Asia/Manila"
      );
      isOpen = now.isAfter(open) && now.isBefore(close);
    }
  }

  return {
    id: shop.coffee_shop_uuid || shop.id,
    name: shop.coffee_shop_name || shop.name,
    address: shop.coffee_shop_address || shop.address,
    city: shop.coffee_shop_city || shop.city,
    rating: shop.rating,
    imageUrl: shop.image_url || shop.imageUrl,
    // ✅ Add formatted payment methods here


    vibes: (shop.coffee_shop_vibes || shop.vibes || [])
      .map((v) => v?.vibe?.vibe_name)
      .filter(Boolean),

    amenities: (shop.coffee_shop_amenities || shop.amenities || [])
      .map((a) => a?.amenity?.amenity_name)
      .filter(Boolean),

    isOpen,
  };
};

const formatCoffeeShopById = (shop) => {
  const now = dayjs().tz("Asia/Manila");
  const today = now.format("dddd"); // e.g., "Monday"
  let isOpen = false;

  // ✅ Determine if shop is currently open
  if (shop.opening_hours && shop.opening_hours.length > 0) {
    const todayHours = shop.opening_hours.find((h) => h.day_of_week === today);

    if (
      todayHours &&
      !todayHours.is_closed &&
      todayHours.open_time &&
      todayHours.close_time
    ) {
      const open = dayjs.tz(
        `${now.format("YYYY-MM-DD")}T${todayHours.open_time}`,
        "Asia/Manila"
      );
      const close = dayjs.tz(
        `${now.format("YYYY-MM-DD")}T${todayHours.close_time}`,
        "Asia/Manila"
      );
      isOpen = now.isAfter(open) && now.isBefore(close);
    }
  }

  return {
    id: shop.coffee_shop_uuid || shop.id,
    name: shop.coffee_shop_name || shop.name,
    description: shop.coffee_shop_description || shop.description,
    address: shop.coffee_shop_address || shop.address,
    city: shop.coffee_shop_city || shop.city,
    email: shop.owner_email || shop.email,
    phone: shop.phone_number || shop.phone,
    rating: shop.rating,
    imageUrl: shop.image_url || shop.imageUrl,
    facebook: shop.facebook || [],
    instagram: shop.instagram,
    review_count: shop.review_count || 0,
    latitude: shop.latitude,
    longitude: shop.latitude,

    // ✅ Add formatted payment methods here
    payment_methods: (shop.payment_methods || []).map((pm) => ({
      type: pm.type
        ? pm.type
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        : null,
    })),

    founded: shop.founded ? dayjs(shop.founded).format("MMMM D, YYYY") : null,

    openingHours: (shop.opening_hours || []).map((oh) => ({
      day: oh.day_of_week,
      open: oh.open_time
        ? dayjs
            .tz(`${now.format("YYYY-MM-DD")}T${oh.open_time}`, "Asia/Manila")
            .format("h:mm A")
        : null,
      close: oh.close_time
        ? dayjs
            .tz(`${now.format("YYYY-MM-DD")}T${oh.close_time}`, "Asia/Manila")
            .format("h:mm A")
        : null,
      isClosed: oh.is_closed,
    })),

    vibes: (shop.coffee_shop_vibes || shop.vibes || [])
      .map((v) => v?.vibe?.vibe_name)
      .filter(Boolean),

    amenities: (shop.coffee_shop_amenities || shop.amenities || [])
      .map((a) => a?.amenity?.amenity_name)
      .filter(Boolean),

    isOpen,
  };
};

module.exports = { formatCoffeeShop, formatCoffeeShopById };
