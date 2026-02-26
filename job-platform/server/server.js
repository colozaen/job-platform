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

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB connection error:", err));

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
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ADMIN MIDDLEWARE
const adminMiddleware = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user?.isAdmin) return res.status(403).json({ error: "Admin only" });
  next();
};

// ---------------- AUTH ROUTES ----------------
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
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
  const jobs = await Job.find().sort({ createdAt: -1 });
  res.json(jobs);
});

app.post("/jobs", authMiddleware, async (req, res) => {
  const job = new Job({ ...req.body, postedBy: req.user.id });
  await job.save();
  res.json(job);
});

// ---------------- COMMENT ROUTES ----------------
app.post("/jobs/:id/comments", authMiddleware, async (req, res) => {
  const comment = new Comment({
    job: req.params.id,
    user: req.user.id,
    text: req.body.text
  });
  await comment.save();
  res.json(comment);
});

app.get("/jobs/:id/comments", async (req, res) => {
  const comments = await Comment.find({ job: req.params.id }).populate("user", "name profilePicture");
  res.json(comments);
});

// ---------------- PROFILE ROUTES ----------------
app.put("/profile", authMiddleware, async (req, res) => {
  const { name, bio } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, { name, bio }, { new: true });
  res.json(user);
});

app.post("/profile/picture", authMiddleware, async (req, res) => {
  const result = await cloudinary.uploader.upload(req.body.image, { folder: "profiles" });
  const user = await User.findByIdAndUpdate(req.user.id, { profilePicture: result.secure_url }, { new: true });
  res.json(user);
});

// ---------------- 2FA SETUP ----------------
app.post("/auth/2fa/setup", authMiddleware, async (req, res) => {
  const secret = speakeasy.generateSecret({ length: 20 });
  const url = speakeasy.otpauthURL({ secret: secret.base32, label: req.user.id, issuer: "JobPlatform" });
  const qr = await qrcode.toDataURL(url);
  await User.findByIdAndUpdate(req.user.id, { twoFASecret: secret.base32 });
  res.json({ qr });
});

// ---------------- ADMIN ROUTES ----------------
app.get("/admin/users", adminMiddleware, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// ---------------- SERVER ----------------
app.get("/", (req, res) => {
  res.send("Job Platform API is running 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});