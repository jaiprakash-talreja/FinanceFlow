const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true, min: [0.01, "Amount must be positive"], max: 1e9 },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true, maxlength: 200, default: "" },
    paymentMethod: { type: String, enum: ["cash", "card", "upi", "bank"], default: "upi" },
  },
  { timestamps: true }
);

// Most queries are "this user's transactions, newest first", optionally by type/category.
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });
transactionSchema.index({ note: "text" });

module.exports = mongoose.model("Transaction", transactionSchema);
