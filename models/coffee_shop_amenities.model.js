const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const coffee_shop_amenities = sequelize.define('coffee_shop_amenities', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    coffee_shop_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'coffee_shops',
        key: 'coffee_shop_uuid'
      },
      onDelete: 'CASCADE'
    },
    amenities_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'amenities',
        key: 'amenities_uuid'
      },
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'coffee_shop_amenities',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return coffee_shop_amenities;
};
