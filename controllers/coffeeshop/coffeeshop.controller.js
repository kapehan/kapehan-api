const coffeeshop = require('../../services/coffeeshop/coffeeshop.service');
const { successResponse, errorResponse } = require('../../utils/response');
const {uploadPublicImage} = require("../../services/file/file.public.service")

const create = async (req, reply) => {
  try {
    const file = req.body.file;
    const buffer = await file.toBuffer();
    const formData = req.body;
    const filepath = "uploads";
    const upload_res = await uploadPublicImage(buffer, formData.coffee_shop_name.value, file.mimetype, filepath);
    console.log("upload_res", upload_res);

    const body = {
      ...formData,
      image_url:upload_res.url
    }
    const data = await coffeeshop.create(body);
    reply.code(201).send(successResponse('Coffee shop created successfully.', data));
  } catch (err) {
    reply.code(500).send(errorResponse('Failed to create coffee shop.', err.message));
  }
};


module.exports = { create};
