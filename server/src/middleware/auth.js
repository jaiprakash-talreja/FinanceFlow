const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/token");

// Resolves a JWT to an active user, or throws. Shared by HTTP and Socket.IO auth.
async function userFromToken(token) {
  if (!token) throw ApiError.unauthorized("Missing token");
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
  const user = await User.findById(payload.sub).select("+tokenVersion");
  if (!user || user.tokenVersion !== payload.tv) throw ApiError.unauthorized("Session has ended, please log in again");
  if (!user.isActive) throw ApiError.forbidden("Your account has been deactivated");
  return user;
}

// Token verification middleware: requires "Authorization: Bearer <jwt>".
const protect = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  req.user = await userFromToken(scheme === "Bearer" ? token : null);
  next();
});

// Role-based access control: authorize("admin")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  next();
};

module.exports = { protect, authorize, userFromToken };
