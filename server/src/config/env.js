// Load server/.env no matter which directory the process was started from.
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrls: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean),
};

env.isProd = env.nodeEnv === "production";
env.isTest = env.nodeEnv === "test";

// Fail fast on missing secrets outside of tests.
if (!env.isTest) {
  for (const key of ["mongoUri", "jwtSecret"]) {
    if (!env[key]) throw new Error(`Missing required environment variable for ${key}. See .env.example`);
  }
}

module.exports = env;
