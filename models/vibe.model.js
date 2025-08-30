const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const vibes = sequelize.define('vibes', {
    vibe_uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    vibe_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'vibes',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return vibes;
};
