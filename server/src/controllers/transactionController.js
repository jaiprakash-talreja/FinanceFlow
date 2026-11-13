const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Budget = require("../models/Budget");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { notify } = require("../services/notify");
const { emitToUser } = require("../socket");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const monthKey = (d) => new Date(d).toISOString().slice(0, 7);
const monthRange = (key) => {
  const [y, m] = key.split("-").map(Number);
  return { $gte: new Date(Date.UTC(y, m - 1, 1)), $lt: new Date(Date.UTC(y, m, 1)) };
};

async function ownedCategory(userId, categoryId) {
  const cat = await Category.findOne({ _id: categoryId, user: userId });
  if (!cat) throw ApiError.badRequest("Category not found");
  return cat;
}

// After an expense is saved, warn the user when a budget crosses 80% or 100%.
async function checkBudget(userId, tx, previousAmount = 0) {
  if (tx.type !== "expense") return;
  const month = monthKey(tx.date);
  const budget = await Budget.findOne({ user: userId, category: tx.category, month }).populate("category", "name");
  if (!budget) return;
  const [agg] = await Transaction.aggregate([
    { $match: { user: userId, category: tx.category, type: "expense", date: monthRange(month) } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const spent = agg?.total || 0;
  const before = spent - tx.amount + previousAmount;
  const name = budget.category.name;
  if (before < budget.limit && spent >= budget.limit) {
    await notify(userId, { kind: "budget", title: `Budget exceeded: ${name}`,
      message: `You have spent ₹${spent.toLocaleString("en-IN")} of your ₹${budget.limit.toLocaleString("en-IN")} ${name} budget for ${month}.` });
  } else if (before < budget.limit * 0.8 && spent >= budget.limit * 0.8 && spent < budget.limit) {
    await notify(userId, { kind: "budget", title: `80% of ${name} budget used`,
      message: `₹${spent.toLocaleString("en-IN")} of ₹${budget.limit.toLocaleString("en-IN")} spent on ${name} in ${month}.` });
  }
}

const changed = (userId) => emitToUser(userId, "transactions:changed", { at: Date.now() });

// GET /api/transactions?search=&type=&category=&from=&to=&page=&limit=&sort=
exports.list = asyncHandler(async (req, res) => {
  const { search, type, category, from, to, sort = "-date" } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

  const filter = { user: req.user._id };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(`${to}T23:59:59.999Z`);
  }
  if (search) filter.note = { $regex: escapeRegex(search), $options: "i" };

  const allowedSort = { date: "date", "-date": "-date", amount: "amount", "-amount": "-amount" };
  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort(allowedSort[sort] || "-date")
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "name color icon type")
      .lean(),
    Transaction.countDocuments(filter),
  ]);
  res.json({ items, page, limit, total, pages: Math.ceil(total / limit) || 1 });
});

exports.get = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id }).populate("category", "name color icon type");
  if (!tx) throw ApiError.notFound("Transaction not found");
  res.json(tx);
});

exports.create = asyncHandler(async (req, res) => {
  const { category, amount, date, note, paymentMethod } = req.body;
  const cat = await ownedCategory(req.user._id, category);
  const tx = await Transaction.create({
    user: req.user._id, category: cat._id, type: cat.type, amount, date, note, paymentMethod,
  });
  await checkBudget(req.user._id, tx);
  changed(req.user._id);
  res.status(201).json(await tx.populate("category", "name color icon type"));
});

exports.update = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
  if (!tx) throw ApiError.notFound("Transaction not found");
  const previousAmount = tx.amount;
  if (req.body.category) {
    const cat = await ownedCategory(req.user._id, req.body.category);
    tx.category = cat._id;
    tx.type = cat.type;
  }
  for (const key of ["amount", "date", "note", "paymentMethod"]) if (req.body[key] !== undefined) tx[key] = req.body[key];
  await tx.save();
  await checkBudget(req.user._id, tx, previousAmount);
  changed(req.user._id);
  res.json(await tx.populate("category", "name color icon type"));
});

exports.remove = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!tx) throw ApiError.notFound("Transaction not found");
  changed(req.user._id);
  res.status(204).end();
});

// GET /api/transactions/summary?month=YYYY-MM  -> totals, spending by category, 6-month trend
exports.summary = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(String(req.user._id));
  const month = req.query.month || monthKey(new Date());
  const [y, m] = month.split("-").map(Number);
  const trendStart = new Date(Date.UTC(y, m - 6, 1));

  const [totals, byCategory, trend] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, date: monthRange(month) } },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: "expense", date: monthRange(month) } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: "$category" },
      { $project: { _id: 0, categoryId: "$_id", name: "$category.name", color: "$category.color", icon: "$category.icon", total: 1 } },
      { $sort: { total: -1 } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: trendStart, $lt: monthRange(month).$lt } } },
      { $group: { _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type" }, total: { $sum: "$amount" } } },
    ]),
  ]);

  const income = totals.find((t) => t._id === "income")?.total || 0;
  const expense = totals.find((t) => t._id === "expense")?.total || 0;
  const months = Array.from({ length: 6 }, (_, i) => monthKey(new Date(Date.UTC(y, m - 6 + i, 1))));
  const monthly = months.map((mo) => ({
    month: mo,
    income: trend.find((t) => t._id.month === mo && t._id.type === "income")?.total || 0,
    expense: trend.find((t) => t._id.month === mo && t._id.type === "expense")?.total || 0,
  }));

  res.json({
    month,
    income,
    expense,
    balance: income - expense,
    count: totals.reduce((s, t) => s + t.count, 0),
    byCategory,
    monthly,
  });
});
