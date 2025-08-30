const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const coffee_shop_vibe = sequelize.define('coffee_shop_vibe', {
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
    vibe_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'vibes',
        key: 'vibe_uuid'
      },
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'coffee_shop_vibe',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return coffee_shop_vibe;
};
