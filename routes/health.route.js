module.exports = async function (app) {
  app.get("/healthcheck", async (request, reply) => {
    const now = new Date();

    const phTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Manila" })
    );

    const options = {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, 
    };
    const formattedDate = phTime.toLocaleString("en-US", options);

    return reply.send({
      message: "Server is healthy 🚀",
      date: formattedDate,
      isSuccess: true,
      service: "Kapehan Platform v1"
    });
  });
};
