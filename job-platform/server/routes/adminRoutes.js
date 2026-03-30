const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// Admin check middleware
const adminMiddleware = async (req, res, next) => {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  try {
    const user = await User.findById(req.user.id);
    if (!user?.isAdmin) return res.status(403).json({ error: "Admin only" });
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all users (admin only)
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;