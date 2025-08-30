const amenitiesService = require('../services/amenities.service');
const { successResponse, errorResponse } = require('../utils/response');

const create = async (req, reply) => {
  try {
    const data = await amenitiesService.create(req.body);
    reply.code(201).send(successResponse('Amenities created.', data));
  } catch (err) {
    reply.code(500).send(errorResponse('Failed to create amenities.', err.message));
  }
};

const findAll = async (_, reply) => {
  try {
    const data = await amenitiesService.findAll();
    reply.send(successResponse('Amenities retrieved.', data));
  } catch (err) {
    reply.code(500).send(errorResponse('Failed to retrieve amenities.', err.message));
  }
};

const findById = async (req, reply) => {
  try {
    const data = await amenitiesService.findById(req.params.id);
    if (!data) return reply.code(404).send(errorResponse('Amenities not found.'));
    reply.send(successResponse('Amenities retrieved.', data));
  } catch (err) {
    reply.code(500).send(errorResponse('Failed to retrieve amenities.', err.message));
  }
};

const update = async (req, reply) => {
  try {
    const updated = await amenitiesService.update(req.params.id, req.body);
    if (!updated) return reply.code(404).send(errorResponse('Amenities not found.'));
    reply.send(successResponse('Amenities updated.'));
  } catch (err) {
    reply.code(500).send(errorResponse('Failed to update amenities.', err.message));
  }
};

const remove = async (req, reply) => {
  try {
    const deleted = await amenitiesService.remove(req.params.id);
    if (!deleted) return reply.code(404).send(errorResponse('Amenities not found.'));
    reply.send(successResponse('Amenities deleted.'));
  } catch (err) {
    reply.code(500).send(errorResponse('Failed to delete amenities.', err.message));
  }
};

module.exports = { create, findAll, findById, update, remove };
