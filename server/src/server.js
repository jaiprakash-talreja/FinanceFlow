const http = require("http");
const mongoose = require("mongoose");
const env = require("./config/env");
const connectDB = require("./config/db");
const app = require("./app");
const { initSocket } = require("./socket");
const logger = require("./utils/logger");

async function start() {
  await connectDB(env.mongoUri);
  const server = http.createServer(app);
  initSocket(server, env.clientUrls);
  server.listen(env.port, () => logger.info(`API + Socket.IO listening on port ${env.port} (${env.nodeEnv})`));

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => mongoose.connection.close(false).then(() => process.exit(0)));
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

process.on("unhandledRejection", (err) => logger.error("Unhandled rejection", err));

start().catch((err) => {
  logger.error("Failed to start server", err.message);
  process.exit(1);
});
