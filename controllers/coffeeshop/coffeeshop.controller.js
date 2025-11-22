const coffeeshop = require('../../services/coffeeshop/coffeeshop.service');
const { sendSuccess, sendError } = require('../../utils/response');
const {uploadPublicImage} = require("../../services/file/file.public.service")

const create = async (req, reply) => {
  try {
    const file = req.body.file;
    const buffer = await file.toBuffer();
    const formData = req.body;
    const filepath = "uploads";
    const upload_res = await uploadPublicImage(buffer, formData.name.value, file.mimetype, filepath);
    console.log("upload_res", upload_res);

    const body = {
      ...formData,
      image_url:upload_res.url
    }
    const data = await coffeeshop.create(body);
    reply.code(201).send(sendSuccess('Coffee shop created successfully.', data));
  } catch (err) {
    console.log(err)
    reply.code(500).send(sendError('Failed to create coffee shop.', err.message));
  }
};

const findAll = async (req) => {
  return await coffeeshop.findAll(req.query);
};

const findBySlug = async (req) => {
  const { slug } = req.params; // get slug from the URL param
  return await coffeeshop.findBySlug({ slug });
};



module.exports = { create, findAll, findBySlug};
