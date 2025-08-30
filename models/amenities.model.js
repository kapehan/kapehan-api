const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const amenities = sequelize.define('amenities', {
    amenities_uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    amenities_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'amenities',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return amenities;
};
