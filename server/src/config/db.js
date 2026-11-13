const mongoose = require("mongoose");
const logger = require("../utils/logger");

async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("error", (err) => logger.error("MongoDB error", err.message));
}

module.exports = connectDB;
