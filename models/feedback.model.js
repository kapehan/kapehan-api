const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Feedback = sequelize.define(
    'feedback',
    {
      feedback_uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      coffee_shop_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'coffee_shops',
          key: 'coffee_shop_uuid',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      subject: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'pending',
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'feedback',
      schema: 'public',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return Feedback;
};
