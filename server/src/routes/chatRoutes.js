const router = require("express").Router();
const { body, query } = require("express-validator");
const ctrl = require("../controllers/chatController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

router.use(protect);

router.get("/messages", validate([query("userId").optional().isMongoId()]), ctrl.messages);
router.post("/messages", validate([
  body("text").trim().isLength({ min: 1, max: 1000 }).withMessage("Message must be 1-1000 characters"),
  body("userId").optional().isMongoId(),
]), ctrl.send);
router.get("/conversations", authorize("admin"), ctrl.conversations);

module.exports = router;
