const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Category = require("../models/Category");
const Transaction = require("../models/Transaction");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const currentMonth = () => new Date().toISOString().slice(0, 7);

// GET /api/budgets?month=YYYY-MM -> budgets with amount spent so far
exports.list = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonth();
  const [y, m] = month.split("-").map(Number);
  const budgets = await Budget.find({ user: req.user._id, month }).populate("category", "name color icon").lean();

  const spent = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(String(req.user._id)),
        type: "expense",
        date: { $gte: new Date(Date.UTC(y, m - 1, 1)), $lt: new Date(Date.UTC(y, m, 1)) },
      },
    },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
  ]);
  const byCat = Object.fromEntries(spent.map((s) => [String(s._id), s.total]));

  res.json(budgets.map((b) => ({ ...b, spent: byCat[String(b.category?._id)] || 0 })));
});

exports.create = asyncHandler(async (req, res) => {
  const { category, month, limit } = req.body;
  const cat = await Category.findOne({ _id: category, user: req.user._id, type: "expense" });
  if (!cat) throw ApiError.badRequest("Choose one of your expense categories");
  const budget = await Budget.create({ user: req.user._id, category: cat._id, month, limit });
  res.status(201).json(await budget.populate("category", "name color icon"));
});

exports.update = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { limit: req.body.limit },
    { new: true, runValidators: true }
  ).populate("category", "name color icon");
  if (!budget) throw ApiError.notFound("Budget not found");
  res.json(budget);
});

exports.remove = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!budget) throw ApiError.notFound("Budget not found");
  res.status(204).end();
});
