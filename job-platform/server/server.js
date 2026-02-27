const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

dotenv.config();
const app = express();

// required middleware
app.use(express.json());
app.use(cors());

// single, consistent Mongo URI
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/job-platform";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err && err.message ? err.message : err));

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// MODELS
const User = require("./models/User");
const Job = require("./models/Job");
const Comment = require("./models/Comment");

// AUTH MIDDLEWARE
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// ADMIN MIDDLEWARE
const adminMiddleware = async (req, res, next) => {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  try {
    const user = await User.findById(req.user.id);
    if (!user?.isAdmin) return res.status(403).json({ error: "Admin only" });
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ---------------- AUTH ROUTES ----------------
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashed });
    await user.save();
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, user: { name: user.name, email: user.email, id: user._id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- JOB ROUTES ----------------
app.get("/jobs", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/jobs", authMiddleware, async (req, res) => {
  try {
    const job = new Job({ ...req.body, postedBy: req.user.id });
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------- COMMENT ROUTES ----------------
app.post("/jobs/:id/comments", authMiddleware, async (req, res) => {
  try {
    const comment = new Comment({
      job: req.params.id,
      user: req.user.id,
      text: req.body.text
    });
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/jobs/:id/comments", async (req, res) => {
  try {
    const comments = await Comment.find({ job: req.params.id }).populate("user", "name profilePicture");
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- PROFILE ROUTES ----------------
app.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { name, bio }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/profile/picture", authMiddleware, async (req, res) => {
  try {
    if (!req.body?.image) return res.status(400).json({ error: "Image data required" });
    const result = await cloudinary.uploader.upload(req.body.image, { folder: "profiles" });
    const user = await User.findByIdAndUpdate(req.user.id, { profilePicture: result.secure_url }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------- 2FA SETUP ----------------
app.post("/auth/2fa/setup", authMiddleware, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ length: 20 });
    const url = speakeasy.otpauthURL({ secret: secret.base32, label: req.user.id, issuer: "JobPlatform" });
    const qr = await qrcode.toDataURL(url);
    await User.findByIdAndUpdate(req.user.id, { twoFASecret: secret.base32 });
    res.json({ qr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ADMIN ROUTES ----------------
app.get("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SERVER ----------------
app.get("/", (req, res) => {
  res.send("Job Platform API is running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;