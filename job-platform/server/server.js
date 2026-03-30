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

app.use(express.json());
app.use(cors());

// Route imports
const jobRoutes = require("./routes/jobRoutes");
const profileRoutes = require("./routes/profileRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/jobs", jobRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);

// Models
const User = require("./models/User");
const Job = require("./models/Job");
const Comment = require("./models/Comment");

// DB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected successfully"))
.catch(err => console.error("MongoDB connection error:", err.message));

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

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

// 2FA setup route (optional)
app.post("/auth/2fa/setup", require("./middleware/authMiddleware"), async (req, res) => {
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

// Server test
app.get("/", (req, res) => res.send("Job Platform API is running 🚀"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));