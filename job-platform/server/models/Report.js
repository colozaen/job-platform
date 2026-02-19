// Get all reports
app.get("/admin/reports", adminMiddleware, async (req, res) => {
  const reports = await Report.find()
    .populate("reportedUser")
    .populate("reportedJob");
  res.json(reports);
});

// Ban user
app.put("/admin/ban/:id", adminMiddleware, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isBanned: true });
  res.json({ message: "User banned" });
});
