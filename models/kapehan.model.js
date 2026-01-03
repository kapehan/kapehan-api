const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  // --------------------
  // USERS
  // --------------------
  const Users = sequelize.define(
    "users",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      full_name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      city: { type: DataTypes.STRING }, // references cities.city_value
      role: { type: DataTypes.STRING, defaultValue: "user" },
      username: { type: DataTypes.STRING, allowNull: false, unique: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "users",
      schema: "kapehan",
      timestamps: false,
    }
  );

  // --------------------
  // CITIES
  // --------------------
  const Cities = sequelize.define(
    "cities",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      city_name: { type: DataTypes.STRING, allowNull: false },
      city_value: { type: DataTypes.STRING, allowNull: false, unique: true },
      region: { type: DataTypes.STRING },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "cities",
      schema: "kapehan",
      timestamps: false,
    }
  );

  // --------------------
  // COFFEE SHOPS
  // --------------------
  const CoffeeShops = sequelize.define(
    "coffee_shops",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      owner_id: {
        type: DataTypes.UUID,
        allowNull: true, // now nullable
        references: {
          model: { tableName: "users", schema: "kapehan" },
          key: "id",
        },
      },
      name: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      address: { type: DataTypes.TEXT },
      review_count: {type: DataTypes.BIGINT},
      city: { type: DataTypes.STRING },
      email: { type: DataTypes.STRING },
      rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
      image_url: { type: DataTypes.TEXT },
      founded: { type: DataTypes.DATE },
      status: { type: DataTypes.STRING, defaultValue: "pending" },
      latitude: { type: DataTypes.FLOAT },
      longitude: { type: DataTypes.FLOAT },
      facebook: { type: DataTypes.STRING },
      instagram: { type: DataTypes.STRING },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "coffee_shops",
      schema: "kapehan",
      timestamps: false,
    }
  );

  // --------------------
  // AMENITIES
  // --------------------
  const Amenities = sequelize.define(
    "amenities",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      amenity_name: { type: DataTypes.STRING, allowNull: false },
      amenity_value: { type: DataTypes.STRING, allowNull: false, unique: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "amenities",
      schema: "kapehan",
      timestamps: false,
    }
  );

  // --------------------
  // COFFEE SHOP AMENITIES
  // --------------------
  const CoffeeShopAmenities = sequelize.define(
    "coffee_shop_amenities",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      coffee_shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "coffee_shops", key: "id" },
      },
      amenity_value: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: "amenities", key: "amenity_value" },
      },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "coffee_shop_amenities",
      schema: "kapehan",
      timestamps: false,
    }
  );

  // --------------------
  // VIBES
  // --------------------
  const Vibes = sequelize.define(
    "vibes",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      vibe_name: { type: DataTypes.STRING, allowNull: false },
      vibe_value: { type: DataTypes.STRING, allowNull: false, unique: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "vibes",
      schema: "kapehan",
      timestamps: false,
    }
  );

  // --------------------
  // COFFEE SHOP VIBES
  // --------------------
  const CoffeeShopVibes = sequelize.define(
    "coffee_shop_vibes",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      coffee_shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "coffee_shops", key: "id" },
      },
      vibe_value: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: "vibes", key: "vibe_value" },
      },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "coffee_shop_vibes",
      schema: "kapehan",
      timestamps: false,
    }
  );

  const OpeningHours = sequelize.define(
    "opening_hours",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      coffee_shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "coffee_shops",
          key: "id",
        },
      },
      day_of_week: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      open_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      close_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      is_closed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "opening_hours",
      schema: "kapehan",
      timestamps: false,
    }
  );

  // --------------------
  // PAYMENT_METHOD
  // --------------------
  const PaymentMethod = sequelize.define(
    "payment_method",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      coffee_shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "coffee_shops", key: "id" },
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "payment_method",
      schema: "kapehan",
      timestamps: false,
    }
  );

  // --------------------
  // Menu item
  // --------------------

  const MenuItem = sequelize.define(
    "menu_item",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      coffee_shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      has_variants: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "menu_items",
      schema: "kapehan",
      timestamps: false,
    }
  );

  const MenuItemPrice = sequelize.define(
    "menu_item_price",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      menu_item_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      size: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: "menu_item_prices",
      schema: "kapehan",
      timestamps: false,
    }
  );

  const CoffeeShopReview = sequelize.define(
    "coffee_shop_reviews",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      coffee_shop_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: { tableName: "coffee_shops", schema: "kapehan" },
          key: "id",
        },
      },
      ratings: {
        type: DataTypes.REAL,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      coffee_shop_slug: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "Y",
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: { tableName: "users", schema: "kapehan" },
          key: "id",
        },
      },
    },
    {
      tableName: "coffee_shop_reviews",
      schema: "kapehan",
      timestamps: false,
      defaultScope: {
        where: { is_active: "Y" }, // ✅ only fetch active rows by default
      },
    }
  );

  const UserLocationLog = sequelize.define(
    "user_location_logs",
    {
      user_id: {
        type: DataTypes.UUID,
        primaryKey: true, // single row per user
        allowNull: false,
      },
      is_anonymous: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      city: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      device_type: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      browser: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      os: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("NOW()"),
      },
    },
    {
      tableName: "user_location_logs",
      schema: "kapehan",
      timestamps: false,
    }
  );

  const RecentUserLocationSearch = sequelize.define(
    "recent_user_location_search",
    {
      id: {
        type: DataTypes.BIGINT, // bigserial equivalent
        primaryKey: true,
        autoIncrement: true, // auto-increment
        allowNull: false,
      },
      lat: {
        type: DataTypes.DOUBLE, // latitude
        allowNull: false,
      },
      lon: {
        type: DataTypes.DOUBLE, // longitude
        allowNull: false,
      },
      postcode: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("NOW()"),
      },
    },
    {
      tableName: "recent_user_location_search",
      schema: "kapehan",
      timestamps: false, // we are using our own created_at
    }
  );

  const Otp = sequelize.define("otp", {
      user_id: DataTypes.UUID,
      otp_hash: DataTypes.STRING,
      type: DataTypes.STRING,
      attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
      expires_at: DataTypes.DATE,
      used_at: DataTypes.DATE,
    },
    {
      tableName: "otp",
      schema: "kapehan",
      timestamps: true,            
      createdAt: "created_at",     
      updatedAt: "updated_at"     
  });


  // --------------------
  // Associations
  // --------------------
  Users.hasMany(CoffeeShops, { foreignKey: "owner_id", as: "shops" });
  CoffeeShops.belongsTo(Users, { foreignKey: "owner_id", as: "owner" });

  CoffeeShops.hasMany(CoffeeShopAmenities, {
    foreignKey: "coffee_shop_id",
    as: "amenities",
  });
  CoffeeShopAmenities.belongsTo(CoffeeShops, { foreignKey: "coffee_shop_id" });
  CoffeeShopAmenities.belongsTo(Amenities, {
    foreignKey: "amenity_value",
    targetKey: "amenity_value",
    as: "amenity",
  });
  Amenities.hasMany(CoffeeShopAmenities, {
    foreignKey: "amenity_value",
    sourceKey: "amenity_value",
    as: "shops",
  });

  CoffeeShops.hasMany(CoffeeShopVibes, {
    foreignKey: "coffee_shop_id",
    as: "vibes",
  });
  CoffeeShopVibes.belongsTo(CoffeeShops, { foreignKey: "coffee_shop_id" });
  CoffeeShopVibes.belongsTo(Vibes, {
    foreignKey: "vibe_value",
    targetKey: "vibe_value",
    as: "vibe",
  });
  Vibes.hasMany(CoffeeShopVibes, {
    foreignKey: "vibe_value",
    sourceKey: "vibe_value",
    as: "shops",
  });

  CoffeeShops.belongsTo(Cities, {
    foreignKey: "city",
    targetKey: "city_value",
    as: "city_info",
  });
  Cities.hasMany(CoffeeShops, {
    foreignKey: "city",
    sourceKey: "city_value",
    as: "shops",
  });

  Users.belongsTo(Cities, {
    foreignKey: "city",
    targetKey: "city_value",
    as: "city_info",
  });
  Cities.hasMany(Users, {
    foreignKey: "city",
    sourceKey: "city_value",
    as: "residents",
  });
  // CoffeeShops -> OpeningHours
  CoffeeShops.hasMany(OpeningHours, {
    foreignKey: "coffee_shop_id",
    as: "opening_hours",
  });

  // OpeningHours -> CoffeeShops
  OpeningHours.belongsTo(CoffeeShops, {
    foreignKey: "coffee_shop_id",
    as: "coffee_shop",
  });

  // CoffeeShops -> PaymentMethod
  CoffeeShops.hasMany(PaymentMethod, {
    foreignKey: "coffee_shop_id",
    as: "payment_methods",
  });

  // PaymentMethod -> CoffeeShops
  PaymentMethod.belongsTo(CoffeeShops, {
    foreignKey: "coffee_shop_id",
    as: "coffee_shop",
  });

  // CoffeeShop has many MenuItems (alias: menuItems)
  // MenuItem has many MenuItemPrices (alias: prices)
  CoffeeShops.hasMany(MenuItem, {
    foreignKey: "coffee_shop_id",
    as: "menuItems",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  // MenuItem belongs to CoffeeShops
  MenuItem.belongsTo(CoffeeShops, {
    foreignKey: "coffee_shop_id",
    as: "coffeeShop",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  // MenuItem has many MenuItemPrices
  MenuItem.hasMany(MenuItemPrice, {
    foreignKey: "menu_item_id",
    as: "prices",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  // MenuItemPrice belongs to MenuItem
  MenuItemPrice.belongsTo(MenuItem, {
    foreignKey: "menu_item_id",
    as: "menuItem",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  // Reviews <-> CoffeeShops
  CoffeeShops.hasMany(CoffeeShopReview, {
    foreignKey: "coffee_shop_id",
    as: "reviews",
  });
  CoffeeShopReview.belongsTo(CoffeeShops, {
    foreignKey: "coffee_shop_id",
    as: "coffee_shop",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  // Reviews <-> Users
  Users.hasMany(CoffeeShopReview, {
    foreignKey: "user_id",
    as: "reviews",
  });
  CoffeeShopReview.belongsTo(Users, {
    foreignKey: "user_id",
    as: "user",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  });

  return {
    Users,
    Cities,
    CoffeeShops,
    Amenities,
    CoffeeShopAmenities,
    Vibes,
    CoffeeShopVibes,
    OpeningHours,
    PaymentMethod,
    MenuItem,
    MenuItemPrice,
    CoffeeShopReview,
    UserLocationLog,
    RecentUserLocationSearch,
    Otp
  };
};
