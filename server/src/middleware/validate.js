const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

// Runs express-validator chains and returns 400 with field errors if any fail.
const validate = (chains) => [
  ...chains,
  (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
    next(ApiError.badRequest(details[0].message, details));
  },
];

module.exports = validate;
