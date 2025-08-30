// routes/index.js
const fs = require("fs");
const path = require("path");

async function loadRoutesRecursively(dir, app) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await loadRoutesRecursively(fullPath, app)
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.route.js') &&
      entry.name !== 'index.js' // ignore index.js itself
    ) {
      const routeModule = require(fullPath)
      const route = routeModule.default || routeModule
    
        if(typeof route === 'function'){
            await route(app);
            continue;
        }

        for(let key in route){
            const read_route = route[key];
            if (typeof  read_route === 'function') {
                await read_route(app)
            }
        }
    }
  }
}

module.exports = async function (fastify) {
  const routesPath = path.join(__dirname);
  await loadRoutesRecursively(routesPath, fastify);
};
