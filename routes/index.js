const fs = require("fs");
const path = require("path");

/**
 * Recursively load all .route.js files in a directory
 * @param {string} dir - Directory to scan
 * @param {FastifyInstance} fastify - Fastify instance
 */
async function loadRoutesRecursively(dir, fastify) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await loadRoutesRecursively(fullPath, fastify);
    } else if (entry.isFile() && entry.name.endsWith(".route.js")) {
      console.log("📂 Loading route file:", fullPath);

      // Require the route module
      const routeModule = require(fullPath);

      // If the module exports a function, register it
      if (typeof routeModule === "function") {
        console.log(`➡️ Registering route from ${entry.name}`);
        await routeModule(fastify);
      } else {
        console.warn(`⚠️ Skipping ${entry.name}, it does not export a function`);
      }
    }
  }
}

// Export the main loader function
module.exports = async function (fastify) {
  console.log("🚀 Starting to load routes...");
  await loadRoutesRecursively(__dirname, fastify);
  console.log("✅ Finished loading all routes");
};
