const router = require("express").Router();
const { body, param, query } = require("express-validator");
const ctrl = require("../controllers/categoryController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const id = param("id").isMongoId().withMessage("Invalid id");

router.use(protect);

router.get("/", validate([query("type").optional().isIn(["income", "expense"])]), ctrl.list);
router.post("/", validate([
  body("name").trim().isLength({ min: 1, max: 40 }).withMessage("Name is required (max 40 chars)"),
  body("type").isIn(["income", "expense"]).withMessage("Type must be income or expense"),
  body("color").optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage("Color must be a hex value like #22c55e"),
  body("icon").optional().matches(/^[a-z-]{1,20}$/).withMessage("Invalid icon"),
]), ctrl.create);
router.patch("/:id", validate([
  id,
  body("name").optional().trim().isLength({ min: 1, max: 40 }),
  body("color").optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage("Color must be a hex value like #22c55e"),
]), ctrl.update);
router.delete("/:id", validate([id]), ctrl.remove);

module.exports = router;
