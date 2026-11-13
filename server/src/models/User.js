const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email is invalid"],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    isActive: { type: Boolean, default: true },
    currency: { type: String, default: "INR", maxlength: 3 },
    monthlyIncomeGoal: { type: Number, min: 0, default: 0 },
    // Bumped on logout: every token issued before that stops working.
    tokenVersion: { type: Number, default: 0, select: false },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.tokenVersion;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);
