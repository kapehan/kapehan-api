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

      delete require.cache[require.resolve(fullPath)];
      const routeModule = require(fullPath);
      const route = routeModule.default || routeModule;

      if (typeof route === "function") {
        await route(app);
      } else if (typeof route === "object") {
        for (let key in route) {
          const fn = route[key];
          if (typeof fn === "function") await fn(app);
        }
      }
    }
  }
}

module.exports = async function (app) {
  await loadRoutesRecursively(__dirname, app);
  console.log("✅ All routes loaded");
};
