const router = require("express").Router();
const { body, param, query } = require("express-validator");
const ctrl = require("../controllers/transactionController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const id = param("id").isMongoId().withMessage("Invalid id");
const fields = (optional) => {
  const f = (name) => (optional ? body(name).optional() : body(name));
  return [
    f("category").isMongoId().withMessage("Choose a category"),
    f("amount").isFloat({ gt: 0, max: 1e9 }).withMessage("Amount must be greater than 0").toFloat(),
    f("date").isISO8601().withMessage("Date must be a valid date").toDate(),
    body("note").optional().trim().isLength({ max: 200 }).withMessage("Note is too long (max 200)"),
    body("paymentMethod").optional().isIn(["cash", "card", "upi", "bank"]).withMessage("Invalid payment method"),
  ];
};

router.use(protect);

router.get("/summary", validate([
  query("month").optional().matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage("month must be YYYY-MM"),
]), ctrl.summary);

router.get("/", validate([
  query("type").optional().isIn(["income", "expense"]),
  query("category").optional().isMongoId(),
  query("from").optional().isISO8601(),
  query("to").optional().isISO8601(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("search").optional().isLength({ max: 100 }),
]), ctrl.list);

router.get("/:id", validate([id]), ctrl.get);
router.post("/", validate(fields(false)), ctrl.create);
router.put("/:id", validate([id, ...fields(true)]), ctrl.update);
router.delete("/:id", validate([id]), ctrl.remove);

module.exports = router;
