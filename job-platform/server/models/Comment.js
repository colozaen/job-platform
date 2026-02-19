const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  text: String
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);
