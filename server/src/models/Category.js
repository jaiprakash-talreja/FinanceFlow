const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    type: { type: String, enum: ["income", "expense"], required: true },
    color: { type: String, default: "#79746a", match: /^#[0-9a-fA-F]{6}$/ },
    icon: { type: String, default: "🏷️", maxlength: 4 },
  },
  { timestamps: true }
);

// A user cannot have two categories with the same name and type.
categorySchema.index({ user: 1, type: 1, name: 1 }, { unique: true });

categorySchema.statics.DEFAULTS = [
  { name: "Salary", type: "income", color: "#4f8a63", icon: "💼" },
  { name: "Freelance", type: "income", color: "#6f9c8a", icon: "💻" },
  { name: "Food", type: "expense", color: "#ff5f2e", icon: "🍔" },
  { name: "Rent", type: "expense", color: "#8a8577", icon: "🏠" },
  { name: "Transport", type: "expense", color: "#6b7fa3", icon: "🚌" },
  { name: "Shopping", type: "expense", color: "#a87892", icon: "🛍️" },
  { name: "Bills", type: "expense", color: "#d9a441", icon: "💡" },
  { name: "Health", type: "expense", color: "#c46a5a", icon: "💊" },
  { name: "Entertainment", type: "expense", color: "#5f9a9a", icon: "🎬" },
];

module.exports = mongoose.model("Category", categorySchema);
