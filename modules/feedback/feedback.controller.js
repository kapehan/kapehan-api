
const FeedBack = require("../../services/feedback/feedback.service");

const create = async (req) => {
  return await FeedBack.create(req.body);
};

const findAll = async (req) => {
  return await FeedBack.findAll(req.query);
};

const findById = async (req) => {
  const data = await FeedBack.findById(req.params.id);
  if (!data) throw new Error("Feedback not found.");
  return data;
};

const update = async (req) => {
  const data = {
    ...req.body,
    updated_date: new Date(),
  };

  const updated = await FeedBack.update(req.params.id, data);
  if (!updated) throw new Error("Feedback not found.");
  return updated;
};

const remove = async (req) => {


  const deleted = await FeedBack.remove(req.params.id);

  if (!deleted) {
    throw new Error("Feedback not found.");
  }

  return deleted;
};

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove,
};
