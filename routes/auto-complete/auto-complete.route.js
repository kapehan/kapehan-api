const controller = require("../../controllers/auto-complete/autocompletePlaces.controller");
// Adjust paths as needed based on your project structure
const { authMiddleware } = require("../../middleware/middleware.js");
const { AccessLevels } = require("../../utils/accessLevels.js");

module.exports.autoComplete = (app) => {
  app.get(
    "/places/autocomplete",
    {
      preHandler: authMiddleware,
      config: { access: AccessLevels.GUEST },
    },
    controller.autocompletePlaces
  );
};
