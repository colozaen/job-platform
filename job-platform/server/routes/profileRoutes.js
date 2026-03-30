const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const cloudinary = require("cloudinary").v2;

// Update user profile
router.put("/", authMiddleware, async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, bio }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Upload profile picture
router.post("/picture", authMiddleware, async (req, res) => {
  try {
    if (!req.body?.image) return res.status(400).json({ error: "Image data required" });
    const result = await cloudinary.uploader.upload(req.body.image, { folder: "profiles" });
    const user = await User.findByIdAndUpdate(req.user.id, { profilePicture: result.secure_url }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;