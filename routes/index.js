const fs = require("fs");
const path = require("path");

async function loadRoutesRecursively(dir, app) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await loadRoutesRecursively(fullPath, app);
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".route.js") &&
      entry.name !== "index.js"
    ) {
      console.log("📂 Loading route file:", fullPath);

      const routeModule = require(fullPath);
      const route = routeModule.default || routeModule;

      if (typeof route === "function") {
        // directly export function
        await route(app);
      } else if (typeof route === "object") {
        // object of functions
        for (let key in route) {
          const read_route = route[key];
          if (typeof read_route === "function") {
            await read_route(app);
          }
        }
      }
    }
  }
}

module.exports = async function (app, opts) {
  await loadRoutesRecursively(__dirname, app);
};
