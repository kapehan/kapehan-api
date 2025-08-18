const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CoffeeShopReviews = sequelize.define(
    "CoffeeShopReviews",
    {
      _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
        primaryKey: true,
      },

      user_id: { type: DataTypes.STRING, allowNull: false },
      remarks: { type: DataTypes.STRING, allowNull: false },
      coffee_shop_name: { type: DataTypes.STRING, allowNull: false },
      coffee_shop_id: { type: DataTypes.STRING, allowNull: false },
      rating: { type: DataTypes.STRING, allowNull: false },

      created_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "coffee_shop_reviews",
      schema: "public",
      timestamps: false,
    }
  );

  return CoffeeShopReviews;
};
