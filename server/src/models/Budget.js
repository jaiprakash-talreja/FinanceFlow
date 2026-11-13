const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    // Month in YYYY-MM form, e.g. "2026-11"
    month: { type: String, required: true, match: [/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM"] },
    limit: { type: Number, required: true, min: [1, "Limit must be at least 1"] },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, month: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);
