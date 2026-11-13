const router = require("express").Router();
const { body, param, query } = require("express-validator");
const ctrl = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

// Everything here requires a logged-in admin.
router.use(protect, authorize("admin"));

router.get("/stats", ctrl.stats);
router.get("/users", validate([
  query("role").optional().isIn(["user", "admin"]),
  query("search").optional().isLength({ max: 100 }),
  query("page").optional().isInt({ min: 1 }),
]), ctrl.users);
router.patch("/users/:id", validate([
  param("id").isMongoId(),
  body("role").optional().isIn(["user", "admin"]).withMessage("Role must be user or admin"),
  body("isActive").optional().isBoolean().withMessage("isActive must be true or false").toBoolean(),
]), ctrl.updateUser);
router.delete("/users/:id", validate([param("id").isMongoId()]), ctrl.deleteUser);
router.post("/announcements", validate([
  body("title").trim().isLength({ min: 3, max: 100 }).withMessage("Title must be 3-100 characters"),
  body("message").trim().isLength({ min: 3, max: 500 }).withMessage("Message must be 3-500 characters"),
]), ctrl.announce);

module.exports = router;
