const coffeeShopsController = require("../../controllers/coffee-shops/coffee_shops.controller")

async function cafesRoutes(fastify) {
    // Create
    //   fastify.post("/review/create", create);

    // Get all
    //   fastify.get("/reviews", async (req, reply) => {
    //     const result = await findAll(req);
    //     return reply.send({
    //       data: result.results,
    //       pageInfo: result.pageInfo,
    //       status: 200,
    //     });
    //   });

    //   // Get by ID
    //   fastify.get("/review/:id", async (req, reply) => {
    //     try {
    //       const data = await findById(req);
    //       return reply.send({ data, status: 200 });
    //     } catch (err) {
    //       return reply.status(404).send({ message: err.message });
    //     }
    //   });

    //   // Update
    //   fastify.post("/review/:id/update", async (req, reply) => {
    //     try {
    //       const data = await update(req);
    //       return reply.send({ data, status: 200 });
    //     } catch (err) {
    //       return reply.status(404).send({ message: err.message });
    //     }
    //   });

    //   // Delete
    //   fastify.post("/review/:id/delete", async (req, reply) => {
    //     try {
    //       const data = await remove(req);
    //       return reply.send({ data, status: 200 });
    //     } catch (err) {
    //       return reply.status(404).send({ message: err.message });
    //     }
    //   });

    //   Get all
    fastify.get("/mid", async (req, reply) => {
        const { lat1, lon1, lat2, lon2, radius = 3000 } = req.query;

        try {
            const res = await coffeeShopsController.findShopsMidpoint(lat1, lon1, lat2, lon2, radius)
            reply.send(res)
        } catch (error) {
            console.log('error', error)
            reply.send(error)
        }
    });
}

module.exports = cafesRoutes;
