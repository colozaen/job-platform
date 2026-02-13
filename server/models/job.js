const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
    profile: String,
    age: Number,
    salary: String,
    expectations: String,
    JobType: String,
    gender: String,
    whatsapp: String

}, {
timestamps: true
});

module.exports = mongoose.model("job", JobSchema);