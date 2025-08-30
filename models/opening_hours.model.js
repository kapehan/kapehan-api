const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const opening_hours = sequelize.define('opening_hours', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // gen_random_uuid()
      primaryKey: true,
      allowNull: false
    },
    coffee_shop_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'coffee_shops',
        key: 'coffee_shop_uuid'
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION' // IDs shouldn’t be updated
    },
    opening_hours: {
      type: DataTypes.TIME,
      allowNull: true
    },
    closing_hours: {
      type: DataTypes.TIME,
      allowNull: true
    },
    day_of_the_week: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    is_closed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    opening_hours_uuid: {
      type: DataTypes.UUID,
      allowNull: true
      // Consider removing if not needed as id already exists
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'opening_hours',
    schema: 'public',
    timestamps: false,  // Because you have created_at manually
  });

  return opening_hours;
};
