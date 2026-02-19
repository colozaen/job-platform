const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  bio: String,
  profilePicture: String,
  videoIntro: String,
  reputation: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  isVerifiedEmployer: { type: Boolean, default: false },
  twoFASecret: String
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
