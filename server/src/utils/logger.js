// Minimal levelled logger with timestamps. Silent during tests.
const isTest = process.env.NODE_ENV === "test";

function log(level, ...args) {
  if (isTest) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase().padEnd(5)}`;
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line, ...args);
}

module.exports = {
  info: (...a) => log("info", ...a),
  warn: (...a) => log("warn", ...a),
  error: (...a) => log("error", ...a),
};
