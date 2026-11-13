const Notification = require("../models/Notification");
const { emitToUser } = require("../socket");

// Saves a notification and pushes it live to the user's open tabs.
async function notify(userId, { kind = "system", title, message }) {
  const n = await Notification.create({ user: userId, kind, title, message });
  emitToUser(userId, "notification:new", n.toJSON());
  return n;
}

module.exports = { notify };
