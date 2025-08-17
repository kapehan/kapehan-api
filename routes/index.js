// routes/index.js
const fs = require("fs");
const path = require("path");

async function loadRoutesRecursively(dir, fastify) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await loadRoutesRecursively(fullPath, fastify);
    } else if (entry.isFile() && entry.name.endsWith(".route.js")) {
      const routeModule = require(fullPath);
      if (typeof routeModule === "function") {
        await routeModule(fastify);
      }
    }
  }
}

module.exports = async function (fastify) {
  const routesPath = path.join(__dirname);
  await loadRoutesRecursively(routesPath, fastify);
};
