const router = require("express").Router();
const { body, param, query } = require("express-validator");
const ctrl = require("../controllers/budgetController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const month = /^\d{4}-(0[1-9]|1[0-2])$/;
const limit = body("limit").isFloat({ min: 1, max: 1e9 }).withMessage("Limit must be at least 1").toFloat();

router.use(protect);

router.get("/", validate([query("month").optional().matches(month).withMessage("month must be YYYY-MM")]), ctrl.list);
router.post("/", validate([
  body("category").isMongoId().withMessage("Choose a category"),
  body("month").matches(month).withMessage("Month must be YYYY-MM"),
  limit,
]), ctrl.create);
router.patch("/:id", validate([param("id").isMongoId(), limit]), ctrl.update);
router.delete("/:id", validate([param("id").isMongoId()]), ctrl.remove);

module.exports = router;
