// Socket.IO setup: authenticated connections, per-user rooms, admin room, presence and live chat.
const { Server } = require("socket.io");
const logger = require("../utils/logger");

let io = null;
const online = new Map(); // userId -> number of open sockets

const userRoom = (id) => `user:${id}`;

function emitToUser(userId, event, payload) {
  if (io) io.to(userRoom(userId)).emit(event, payload);
}

function emitToAdmins(event, payload) {
  if (io) io.to("admins").emit(event, payload);
}

function onlineUserIds() {
  return [...online.keys()];
}

function disconnectUser(userId) {
  if (io) io.in(userRoom(userId)).disconnectSockets(true);
}

function initSocket(httpServer, corsOrigins) {
  // Required lazily to avoid a circular import (auth -> models, chat -> socket).
  const { userFromToken } = require("../middleware/auth");
  const { sendMessage } = require("../controllers/chatController");

  io = new Server(httpServer, { cors: { origin: corsOrigins, credentials: true } });

  // Reject the handshake unless it carries a valid JWT.
  io.use(async (socket, next) => {
    try {
      socket.user = await userFromToken(socket.handshake.auth?.token);
      next();
    } catch (err) {
      next(new Error(err.message || "Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const { user } = socket;
    const id = String(user._id);
    socket.join(userRoom(id));
    if (user.role === "admin") socket.join("admins");

    online.set(id, (online.get(id) || 0) + 1);
    emitToAdmins("presence:update", onlineUserIds());
    logger.info(`Socket connected: ${user.email} (${online.get(id)} open)`);

    socket.on("chat:send", async ({ text, toUserId } = {}, ack) => {
      try {
        const msg = await sendMessage(user, text, toUserId);
        ack?.({ ok: true, message: msg });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("chat:typing", ({ toUserId } = {}) => {
      if (user.role === "admin" && toUserId) emitToUser(toUserId, "chat:typing", { from: "support" });
      else emitToAdmins("chat:typing", { userId: id, name: user.name });
    });

    socket.on("disconnect", (reason) => {
      const left = (online.get(id) || 1) - 1;
      if (left <= 0) online.delete(id);
      else online.set(id, left);
      emitToAdmins("presence:update", onlineUserIds());
      logger.info(`Socket disconnected: ${user.email} (${reason})`);
    });
  });

  return io;
}

module.exports = { initSocket, emitToUser, emitToAdmins, onlineUserIds, disconnectUser };
