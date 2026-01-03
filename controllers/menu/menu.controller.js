const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const service = require("../../services/menu/menu.service");

const create = async (req) => {
  return await service.create(req.params.id, req.body);
};

const update = async (req) => {
  return await service.edit(req.params.id, req.body);
};

const toggleMenuStatus = async (req) => {
  return await service.updateMenuItemStatus(req.params.id);
};

const findMenubyCoffeeShopSlug = async (req) => {
  const { slug } = req.params; // get slug from the URL param
  return await service.findMenubyCoffeeShopSlug({ slug });
};

module.exports = {
  create,
  update,
  toggleMenuStatus,
  findMenubyCoffeeShopSlug,
};
