const services = require("../../services/auto-complete/autoCompletePlaces.service");

const autocompletePlaces = async (req) => {
  return await services.findAll(req.query);
};

module.exports = { autocompletePlaces };
