// server/routes/jobRoutes.js
const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const Comment = require("../models/Comment");
const authMiddleware = require("../middleware/authMiddleware"); // create this if you haven't
// If you don't have a separate file for authMiddleware, copy it from server.js

// ---------------------- JOB ROUTES ----------------------

// GET all jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new job (authenticated users only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const job = new Job({ ...req.body, postedBy: req.user.id });
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------- COMMENT ROUTES ----------------------

// POST a comment for a job
router.post("/:id/comments", authMiddleware, async (req, res) => {
  try {
    const comment = new Comment({
      job: req.params.id,
      user: req.user.id,
      text: req.body.text,
    });
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET comments for a job
router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ job: req.params.id }).populate(
      "user",
      "name profilePicture"
    );
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;