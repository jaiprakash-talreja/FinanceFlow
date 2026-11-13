const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    type: { type: String, enum: ["income", "expense"], required: true },
    color: { type: String, default: "#6366f1", match: /^#[0-9a-fA-F]{6}$/ },
    icon: { type: String, default: "🏷️", maxlength: 4 },
  },
  { timestamps: true }
);

// A user cannot have two categories with the same name and type.
categorySchema.index({ user: 1, type: 1, name: 1 }, { unique: true });

categorySchema.statics.DEFAULTS = [
  { name: "Salary", type: "income", color: "#16a34a", icon: "💼" },
  { name: "Freelance", type: "income", color: "#0d9488", icon: "💻" },
  { name: "Food", type: "expense", color: "#f97316", icon: "🍔" },
  { name: "Rent", type: "expense", color: "#ef4444", icon: "🏠" },
  { name: "Transport", type: "expense", color: "#3b82f6", icon: "🚌" },
  { name: "Shopping", type: "expense", color: "#a855f7", icon: "🛍️" },
  { name: "Bills", type: "expense", color: "#eab308", icon: "💡" },
  { name: "Health", type: "expense", color: "#ec4899", icon: "💊" },
  { name: "Entertainment", type: "expense", color: "#06b6d4", icon: "🎬" },
];

module.exports = mongoose.model("Category", categorySchema);
