const { getDashboardAnalytics } = require("../../controllers/dashboard/dashboard.controller");

async function dashboardRoutes(fastify, options) {
  // GET /dashboard/analytics
  fastify.get("/analytics", getDashboardAnalytics);
}

module.exports = dashboardRoutes;
