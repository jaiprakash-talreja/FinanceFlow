const router = require("express").Router();
const { param } = require("express-validator");
const ctrl = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

router.use(protect);

router.get("/", ctrl.list);
router.patch("/read-all", ctrl.markAllRead);
router.patch("/:id/read", validate([param("id").isMongoId()]), ctrl.markRead);
router.delete("/:id", validate([param("id").isMongoId()]), ctrl.remove);

module.exports = router;
