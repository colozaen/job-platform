export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "POST") {
    const { username} = req.body;
    res.status(200).json({ message: `User ${username} logged in successfully!` });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}