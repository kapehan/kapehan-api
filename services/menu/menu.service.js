const { menu_item, menu_item_price, coffee_shops } = require("../db.service"); // added coffee_shops
const { Op } = require("sequelize");
const { sendSuccess, sendError } = require("../../utils/response");

const create = async (coffee_shop_id, menuData, t) => {
  console.log(menuData);
  try {
    const {
      name,
      description,
      category,
      has_variants,
      is_active,
      price,
      variants,
    } = menuData;

    // Validate required fields
    if (
      !name ||
      (has_variants && !variants) ||
      (!has_variants && price == null)
    ) {
      return sendError("Name and pricing information are required fields");
    }

    // Create a single menu item
    const createdMenuItem = await menu_item.create(
      {
        coffee_shop_id,
        name,
        description: description || null,
        category: category || null,
        has_variants: !!has_variants,
        created_at: new Date(),
        is_active: is_active || "Y",
      },
      { transaction: t }
    );

    console.log("✅ Created menu item:", createdMenuItem.toJSON());

    // Create prices for the menu item
    if (has_variants) {
      for (const variant of variants) {
        await menu_item_price.create(
          {
            menu_item_id: createdMenuItem.id,
            size: variant.size || null,
            price: parseFloat(variant.price),
          },
          { transaction: t }
        );
      }
    } else {
      // Single price case
      await menu_item_price.create(
        {
          menu_item_id: createdMenuItem.id,
          size: null,
          price: parseFloat(price),
        },
        { transaction: t }
      );
    }

    return sendSuccess(createdMenuItem, "Menu item created successfully");
  } catch (error) {
    console.error("❌ Error creating menu:", error);
    return sendError(`Failed to create menu: ${error.message}`);
  }
};

const edit = async (menu_item_id, menuData, t) => {
  console.log(menuData);
  try {
    const {
      name,
      description,
      category,
      has_variants,
      is_active,
      price,
      variants,
    } = menuData;

    // Validate required fields
    if (
      !name ||
      (has_variants && !variants) ||
      (!has_variants && price == null)
    ) {
      return sendError("Name and pricing information are required fields");
    }

    // Update the menu item
    const updatedMenuItem = await menu_item.update(
      {
        name,
        description: description || null,
        category: category || null,
        has_variants: !!has_variants,
        is_active: is_active || "Y",
      },
      {
        where: { id: menu_item_id },
        transaction: t,
      }
    );

    console.log("✅ Updated menu item:", updatedMenuItem);

    // Delete existing prices for the menu item
    await menu_item_price.destroy({
      where: { menu_item_id },
      transaction: t,
    });

    // Create new prices for the menu item
    if (has_variants) {
      for (const variant of variants) {
        await menu_item_price.create(
          {
            menu_item_id,
            size: variant.size || null,
            price: parseFloat(variant.price),
          },
          { transaction: t }
        );
      }
    } else {
      // Single price case
      await menu_item_price.create(
        {
          menu_item_id,
          size: null,
          price: parseFloat(price),
        },
        { transaction: t }
      );
    }

    return sendSuccess({ id: menu_item_id }, "Menu item updated successfully");
  } catch (error) {
    console.error("❌ Error updating menu:", error);
    return sendError(`Failed to update menu: ${error.message}`);
  }
};

const updateMenuItemStatus = async (menu_item_id, t) => {
  try {
    // Find the menu item by ID
    const menuItem = await menu_item.findOne({
      where: { id: menu_item_id },
      attributes: ["id", "is_active"],
      transaction: t,
    });

    if (!menuItem) {
      return sendError("Menu item not found");
    }

    // Toggle the is_active status
    const newStatus = menuItem.is_active === "Y" ? "N" : "Y";

    // Update the menu item's status
    await menu_item.update(
      { is_active: newStatus },
      {
        where: { id: menu_item_id },
        transaction: t,
      }
    );

    return sendSuccess(
      { id: menu_item_id, is_active: newStatus },
      "Menu item status updated successfully"
    );
  } catch (error) {
    console.error("❌ Error updating menu item status:", error);
    return sendError(`Failed to update menu item status: ${error.message}`);
  }
};

const findMenubyCoffeeShopSlug = async (params, reply) => {
  try {
    const { slug } = params;
    if (!slug) return sendError("Slug is required");

    const shop = await coffee_shops.findOne({
      where: { slug },
      attributes: ["id", "name", "slug"],
      include: [
        {
          model: menu_item,
          as: "menuItems", // match model alias
          required: false,
          attributes: [
            "id",
            "name",
            "description",
            "category",
            "has_variants",
            "is_active",
          ],
          include: [
            {
              model: menu_item_price,
              as: "prices", // match model alias
              required: false,
              attributes: ["size", "price"],
            },
          ],
        },
      ],
    });

    if (!shop) return sendError("Coffee shop not found", 404);

    const items = (shop.menuItems || []).map((mi) => ({
      id: mi.id,
      name: mi.name,
      description: mi.description,
      category: mi.category,
      has_variants: !!mi.has_variants,
      is_active: mi.is_active,
      variants: (mi.prices || [])
        .filter((p) => p.size != null)
        .map((p) => ({ size: p.size, price: Number(p.price) })),
      price: (() => {
        const base = (mi.prices || []).find((p) => p.size == null);
        return base ? Number(base.price) : null;
      })(),
    }));

    const menuByCategory = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    return sendSuccess({ menu: menuByCategory }, "Menu fetched successfully");
  } catch (error) {
    console.error("❌ Error fetching menu:", error);
    return sendError(`Failed to fetch menu: ${error.message}`);
  }
};

module.exports = {
  create,
  edit,
  updateMenuItemStatus,
  findMenubyCoffeeShopSlug,
};
