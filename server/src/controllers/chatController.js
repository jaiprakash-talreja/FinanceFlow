const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { emitToUser, emitToAdmins } = require("../socket");
const { notify } = require("../services/notify");

// Users only ever see their own thread; admins pick a thread with ?userId=
function conversationId(req, requested) {
  if (req.user.role === "admin") {
    if (!requested) throw ApiError.badRequest("userId is required for admins");
    return requested;
  }
  return req.user._id;
}

// GET /api/chat/messages[?userId=]
exports.messages = asyncHandler(async (req, res) => {
  const conversation = conversationId(req, req.query.userId);
  const items = await Message.find({ conversation })
    .sort({ createdAt: 1 })
    .limit(200)
    .populate("sender", "name role")
    .lean();
  res.json(items);
});

// POST /api/chat/messages { text, userId? }  (REST fallback; the UI sends through Socket.IO)
exports.send = asyncHandler(async (req, res) => {
  const msg = await sendMessage(req.user, req.body.text, req.body.userId);
  res.status(201).json(msg);
});

// GET /api/chat/conversations  (admin) -> users who have chatted, newest first
exports.conversations = asyncHandler(async (req, res) => {
  const rows = await Message.aggregate([
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$conversation", lastMessage: { $first: "$text" }, lastAt: { $first: "$createdAt" }, fromAdmin: { $first: "$fromAdmin" } } },
    { $sort: { lastAt: -1 } },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user", pipeline: [{ $project: { name: 1, email: 1 } }] } },
    { $unwind: "$user" },
  ]);
  res.json(rows);
});

// Shared by the REST route and the socket handler.
async function sendMessage(sender, text, toUserId) {
  const clean = String(text || "").trim();
  if (!clean) throw ApiError.badRequest("Message cannot be empty");
  if (clean.length > 1000) throw ApiError.badRequest("Message is too long");

  const isAdmin = sender.role === "admin";
  let conversation = sender._id;
  if (isAdmin) {
    if (!toUserId || !mongoose.isValidObjectId(toUserId)) throw ApiError.badRequest("Choose a user to reply to");
    if (!(await User.exists({ _id: toUserId }))) throw ApiError.notFound("User not found");
    conversation = toUserId;
  }

  const msg = await Message.create({ conversation, sender: sender._id, text: clean, fromAdmin: isAdmin });
  const payload = { ...msg.toJSON(), sender: { _id: sender._id, name: sender.name, role: sender.role } };
  emitToUser(conversation, "chat:message", payload);
  emitToAdmins("chat:message", payload);
  if (isAdmin) {
    await notify(conversation, { kind: "chat", title: "New reply from support", message: clean.slice(0, 120) });
  }
  return payload;
}

exports.sendMessage = sendMessage;
