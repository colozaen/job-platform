const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  expectation: String,
  salary: String,
  type: String,
  age: String,
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  whatsapp: String,
  verified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);
