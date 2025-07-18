const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, default: "" },
    about: { type: String, default: "" },
    mobile: { type: String, default: "" },
    otp: { type: String }, // optional if stored in DB
    verified: { type: Boolean, default: false }, // ✅ required for login check
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
