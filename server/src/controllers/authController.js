const User = require("../models/User");
const Category = require("../models/Category");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../utils/token");
const logger = require("../utils/logger");

const session = (user, tokenVersion) => ({ token: signToken(user, tokenVersion), user: user.toJSON() });

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email: email.toLowerCase() })) throw ApiError.conflict("Email is already registered");

  // Public sign-up always creates a normal user; admins are promoted by another admin.
  const user = await User.create({ name, email, password, role: "user" });
  await Category.insertMany(Category.DEFAULTS.map((c) => ({ ...c, user: user._id })));
  logger.info(`New user registered: ${user.email}`);
  res.status(201).json(session(user, 0));
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password +tokenVersion");
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized("Invalid email or password");
  if (!user.isActive) throw ApiError.forbidden("Your account has been deactivated");

  user.lastLoginAt = new Date();
  await user.save();
  res.json(session(user, user.tokenVersion));
});

// GET /api/auth/me
exports.me = (req, res) => res.json({ user: req.user.toJSON() });

// PATCH /api/auth/me
exports.updateMe = asyncHandler(async (req, res) => {
  for (const key of ["name", "currency", "monthlyIncomeGoal"]) {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  }
  await req.user.save();
  res.json({ user: req.user.toJSON() });
});

// PATCH /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+password +tokenVersion");
  if (!(await user.comparePassword(req.body.currentPassword))) throw ApiError.badRequest("Current password is incorrect");
  user.password = req.body.newPassword;
  user.tokenVersion += 1; // log out other sessions
  await user.save();
  res.json(session(user, user.tokenVersion));
});

// POST /api/auth/logout  -> invalidates every token issued so far
exports.logout = asyncHandler(async (req, res) => {
  await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
  res.status(204).end();
});
