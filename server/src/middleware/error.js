const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");
const env = require("../config/env");

function notFound(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// Converts any error into a consistent JSON response: { error, details? }
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "Something went wrong";
  let details = err.details;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = details[0]?.message || "Validation failed";
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue || {}).join(", ") || "Value"} already exists`;
  } else if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  }

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl}`, err.stack || err);
    if (env.isProd) message = "Internal server error"; // never leak internals in production
  }

  res.status(status).json({ error: message, ...(details ? { details } : {}) });
}

module.exports = { notFound, errorHandler };
