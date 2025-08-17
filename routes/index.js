const fs = require("fs");
const path = require("path");
const fp = require("fastify-plugin");

async function loadRoutesRecursively(dir, fastify) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await loadRoutesRecursively(fullPath, fastify);
    } else if (entry.isFile() && entry.name.endsWith(".route.js") && entry.name !== "index.js") {
      delete require.cache[require.resolve(fullPath)];
      const routeModule = require(fullPath);
      const route = routeModule.default || routeModule;

      if (typeof route === "function") {
        await route(fastify);
      } else if (typeof route === "object") {
        for (let key in route) {
          const fn = route[key];
          if (typeof fn === "function") await fn(fastify);
        }
      }
    }
  }
}

module.exports = fp(async function (fastify, opts) {
  await loadRoutesRecursively(__dirname, fastify);
});
