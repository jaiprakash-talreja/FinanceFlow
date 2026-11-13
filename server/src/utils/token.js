const jwt = require("jsonwebtoken");
const env = require("../config/env");

const secret = () => env.jwtSecret || "test-secret";

function signToken(user, tokenVersion) {
  return jwt.sign({ sub: String(user._id), role: user.role, tv: tokenVersion }, secret(), {
    expiresIn: env.jwtExpiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, secret());
}

module.exports = { signToken, verifyToken };
