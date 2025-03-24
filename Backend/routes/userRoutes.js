import express from "express";
import cookieParser from "cookie-parser";

const router = express.Router();

// Middleware to parse cookies
router.use(cookieParser());

// Route to get user ID from cookie
router.get("/get-user-id", (req, res) => {
  const userId = req.cookies.userId;
  if (userId) {
    res.json({ userId });
  } else {
    res.status(400).json({ message: "User ID not found in cookies" });
  }
});

export default router;
