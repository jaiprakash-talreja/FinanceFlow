const Category = require("../models/Category");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// Every query is scoped to req.user so one user can never touch another user's data (no IDOR).
const owned = (req) => ({ _id: req.params.id, user: req.user._id });

exports.list = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.type) filter.type = req.query.type;
  res.json(await Category.find(filter).sort({ type: 1, name: 1 }).lean());
});

exports.create = asyncHandler(async (req, res) => {
  const { name, type, color, icon } = req.body;
  const cat = await Category.create({ user: req.user._id, name, type, color, icon });
  res.status(201).json(cat);
});

exports.update = asyncHandler(async (req, res) => {
  const updates = {};
  for (const key of ["name", "color", "icon"]) if (req.body[key] !== undefined) updates[key] = req.body[key];
  const cat = await Category.findOneAndUpdate(owned(req), updates, { new: true, runValidators: true });
  if (!cat) throw ApiError.notFound("Category not found");
  res.json(cat);
});

exports.remove = asyncHandler(async (req, res) => {
  const cat = await Category.findOne(owned(req));
  if (!cat) throw ApiError.notFound("Category not found");
  const used = await Transaction.countDocuments({ user: req.user._id, category: cat._id });
  if (used > 0) throw ApiError.conflict(`Category is used by ${used} transaction(s). Reassign or delete them first.`);
  await Budget.deleteMany({ user: req.user._id, category: cat._id });
  await cat.deleteOne();
  res.status(204).end();
});
