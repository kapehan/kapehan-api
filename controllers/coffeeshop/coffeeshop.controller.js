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

const find = async (req, reply) => {
  try {
    const data = await coffeeshop.find(req);
    
    if (!data) return reply.code(404).send(errorResponse('Coffee Shop not found.'));
      const pageInfo = {
        total: data.count,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.pageSize) || 10,
        totalPages: Math.ceil(data.count / (parseInt(req.query.pageSize) || 10))
      }
    reply.send(successResponse('Coffee Shop fetched successfully.', data.rows, pageInfo));
  } catch (err) {
    console.log("errorr", err);
    reply.code(500).send(errorResponse('Failed to fetch Coffee Shop.', `${err.message}: ${err?.errors[0]?.message}`));
  }
};

const update = async (req, reply) => {
  try {
    let url;
    const id = req.params.id;
    if(req.body.file){
    const file = req.body.file;
    const buffer = await file.toBuffer();
    const formData = req.body;
    const filepath = "uploads";
    const upload_res = await uploadPublicImage(buffer, formData.coffee_shop_name.value, file.mimetype, filepath);
    url = upload_res.url;
    }


    const body = {
      ...formData,
      image_url:url
    }
    const data = await coffeeshop.update(id, body);
    reply.code(201).send(successResponse('Coffee shop created successfully.', data));
  } catch (err) {
    reply.code(500).send(errorResponse('Failed to create coffee shop.', err.message));
  }
};

const _delete = async (req, reply) => {
  try {
    const id = req.params.id;
    const data = await coffeeshop._delete(id, body);
    reply.code(201).send(successResponse('Coffee shop created successfully.', data));
  } catch (err) {
    reply.code(500).send(errorResponse('Failed to create coffee shop.', err.message));
  }
};

module.exports = { create, find, update, _delete };
