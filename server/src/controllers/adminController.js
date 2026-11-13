const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Budget = require("../models/Budget");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { notify } = require("../services/notify");
const { onlineUserIds, disconnectUser } = require("../socket");
const logger = require("../utils/logger");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/admin/stats
exports.stats = asyncHandler(async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const [users, admins, active, newThisWeek, txCount, volume] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    Transaction.countDocuments(),
    Transaction.aggregate([{ $group: { _id: "$type", total: { $sum: "$amount" } } }]),
  ]);
  res.json({
    users, admins, active, newThisWeek,
    transactions: txCount,
    online: onlineUserIds().length,
    volume: Object.fromEntries(volume.map((v) => [v._id, v.total])),
  });
});

// GET /api/admin/users?search=&role=&page=
exports.users = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    const rx = { $regex: escapeRegex(req.query.search), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  const online = new Set(onlineUserIds());
  res.json({
    items: items.map((u) => ({ ...u.toJSON(), online: online.has(String(u._id)) })),
    page, total, pages: Math.ceil(total / limit) || 1,
  });
});

// PATCH /api/admin/users/:id { role?, isActive? }
exports.updateUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw ApiError.badRequest("You cannot change your own role or status");
  const user = await User.findById(req.params.id).select("+tokenVersion");
  if (!user) throw ApiError.notFound("User not found");

  if (req.body.role !== undefined) user.role = req.body.role;
  if (req.body.isActive !== undefined) {
    user.isActive = req.body.isActive;
    if (!user.isActive) {
      user.tokenVersion += 1; // kick out existing sessions
      disconnectUser(user._id);
    }
  }
  await user.save();
  logger.info(`Admin ${req.user.email} updated ${user.email}: role=${user.role} active=${user.isActive}`);
  res.json(user);
});

// DELETE /api/admin/users/:id -> removes the user and all their data
exports.deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw ApiError.badRequest("You cannot delete your own account here");
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  await Promise.all([
    Transaction.deleteMany({ user: user._id }),
    Category.deleteMany({ user: user._id }),
    Budget.deleteMany({ user: user._id }),
    Notification.deleteMany({ user: user._id }),
    Message.deleteMany({ conversation: user._id }),
  ]);
  await user.deleteOne();
  disconnectUser(user._id);
  logger.info(`Admin ${req.user.email} deleted user ${user.email}`);
  res.status(204).end();
});

// POST /api/admin/announcements { title, message } -> live notification to every active user
exports.announce = asyncHandler(async (req, res) => {
  const users = await User.find({ isActive: true }).select("_id").lean();
  await Promise.all(users.map((u) => notify(u._id, { kind: "announcement", title: req.body.title, message: req.body.message })));
  res.status(201).json({ sent: users.length });
});
