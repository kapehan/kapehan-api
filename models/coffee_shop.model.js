const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const coffee_shop = sequelize.define('coffee_shop', {
    coffee_shop_uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    coffee_shop_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    coffee_shop_description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    coffee_shop_address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    coffee_shop_city: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    owner_email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { isEmail: true }
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: { min: 0, max: 5 }
    },
    price_range: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    coffee_shop_latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },
    coffee_shop_longtitude: {
        type: DataTypes.DOUBLE,
        allowNull: true
    }
  }, {
    tableName: 'coffee_shops',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return coffee_shop;
};
