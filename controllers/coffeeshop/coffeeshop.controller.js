const coffeeshop = require("../../services/coffeeshop/coffeeshop.service");
const { sendSuccess, sendError } = require("../../utils/response");
const {
  uploadPublicImage,
} = require("../../services/file/file.public.service");

const create = async (req, reply) => {
  try {
    console.log("req body", req.body);

    const file = req.body.file;
    let buffer;
    // Support both Buffer and file object with toBuffer
    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else if (file && typeof file.toBuffer === "function") {
      buffer = await file.toBuffer();
    } else if (file && file.buffer) {
      buffer = file.buffer;
    } else {
      throw new Error("Invalid file object: missing buffer or toBuffer()");
    }
    const formData = req.body;
    const filepath = "uploads";
    const upload_res = await uploadPublicImage(
      buffer,
      formData.name?.value || formData.name,
      file.mimetype,
      filepath
    );
    console.log("upload_res", upload_res);

    const body = {
      ...formData,
      image_url: upload_res.url,
    };
    const data = await coffeeshop.create(body);
    reply
      .code(201)
      .send(sendSuccess("Coffee shop created successfully.", data));
  } catch (err) {
    console.log(err);
    reply
      .code(500)
      .send(sendError("Failed to create coffee shop.", err.message));
  }
};

const findAll = async (req) => {
  return await coffeeshop.findAll(req.query);
};

const findBySlug = async (req) => {
  const { slug } = req.params; // get slug from the URL param
  return await coffeeshop.findBySlug({ slug });
};

const findMenubyCoffeeShopSlug = async (req) => {
  const { slug } = req.params; // get slug from the URL param
  return await coffeeshop.findMenubyCoffeeShopSlug({ slug });
};

const getSuggestedCoffeeShop = async (req) => {
  return await coffeeshop.getSuggestedCoffeeShops(req.query);
};

const updateCafeStatus = async (req) => {
  const { slug } = req.params; // get slug from the URL param

  return await coffeeshop.updateStatus({ slug });
};

const updateCoffeeShop = async (req, reply) => {
  try {
    let body = req.body;

    // If file is present, determine if it's a new image or not
    if (body.file?.value) {
      const file = body.file;
      const fileValue = file.value;
      console.log("File value received:", fileValue); // Log the file value

      let buffer;
      // Check if the file value is a URL string
      if (typeof fileValue === "string" && fileValue.startsWith("https")) {
        console.log("File value is a secure URL:", fileValue); // Log if file value is a secure URL
        body = {
          ...body,
          image_url: fileValue,
        };
      }
      // Check if the file value is a Buffer (base64 or binary data)
      else if (Buffer.isBuffer(fileValue)) {
        console.log("File value is a Buffer."); // Log if file value is a Buffer
        buffer = fileValue;
      }
      // Check if the file value is base64 encoded
      else if (
        typeof fileValue === "string" &&
        fileValue.startsWith("data:image")
      ) {
        console.log("File value is base64 encoded."); // Log if file value is base64
        const base64Data = fileValue.split(",")[1]; // Extract base64 data
        buffer = Buffer.from(base64Data, "base64");
      }
      // If the file value doesn't match any valid type
      else {
        console.log("File value is not a valid upload or URL."); // Log if file value is invalid
      }

      // If we have a buffer, upload the image
      if (buffer) {
        console.log("Uploading image..."); // Log before uploading
        const filepath = "uploads";
        const upload_res = await uploadPublicImage(
          buffer,
          body.name?.value || body.name,
          file.mimetype,
          filepath
        );
        console.log("Upload response:", upload_res); // Log the upload response
        body = {
          ...body,
          image_url: upload_res.url,
        };
      }
    } else {
      console.log("No valid file value provided in the request."); // Log if no valid file value is provided
    }

    const { slug } = req.params;
    console.log("Updating coffee shop with slug:", slug); // Log the slug being updated
    console.log("Final body for update:", body); // Log the final body being sent for update

    const data = await coffeeshop.updateCoffeeShop(slug, body);
    console.log("Update response:", data); // Log the response from the update
    reply.send(data);
  } catch (err) {
    console.log("Error during update:", err); // Log the error
    reply
      .code(500)
      .send(sendError("Failed to update coffee shop.", err.message));
  }
};

module.exports = {
  create,
  findAll,
  findBySlug,
  findMenubyCoffeeShopSlug,
  getSuggestedCoffeeShop,
  updateCafeStatus,
  updateCoffeeShop,
};
