const fs = require('fs')
const path = require('path')

async function loadRoutesRecursively(dir, app) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      await loadRoutesRecursively(fullPath, app)
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.route.js') &&
      entry.name !== 'index.js' // ignore index.js itself
    ) {
      const routeModule = require(fullPath)
      const route = routeModule.default || routeModule

    for(let key in route){
        const read_route = route[key];
        if (typeof  read_route === 'function') {
            await read_route(app)
        }
    }
    }
  }
}

module.exports = async function (app, opts) {
  // __dirname here is the directory of this index.js file
  await loadRoutesRecursively(__dirname, app)
}
