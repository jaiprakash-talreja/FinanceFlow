const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const ctrl = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const env = require("../config/env");

// Slow down password guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.isTest ? 1000 : 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again in a few minutes" },
});

const password = (field) =>
  body(field)
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/[A-Za-z]/).withMessage("Password must contain a letter")
    .matches(/\d/).withMessage("Password must contain a number");

router.post("/register", authLimiter, validate([
  body("name").trim().isLength({ min: 2, max: 60 }).withMessage("Name must be 2-60 characters"),
  body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail(),
  password("password"),
]), ctrl.register);

router.post("/login", authLimiter, validate([
  body("email").trim().isEmail().withMessage("Enter a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
]), ctrl.login);

router.get("/me", protect, ctrl.me);

router.patch("/me", protect, validate([
  body("name").optional().trim().isLength({ min: 2, max: 60 }).withMessage("Name must be 2-60 characters"),
  body("currency").optional().isIn(["INR", "USD", "EUR", "GBP"]).withMessage("Unsupported currency"),
  body("monthlyIncomeGoal").optional().isFloat({ min: 0 }).withMessage("Goal must be 0 or more").toFloat(),
]), ctrl.updateMe);

router.patch("/password", protect, validate([
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  password("newPassword"),
]), ctrl.changePassword);

router.post("/logout", protect, ctrl.logout);

module.exports = router;
