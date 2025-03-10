const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");

// Fetch chat history between two users
router.get("/history/:userId/:mentorId", async (req, res) => {
  try {
    const { userId, mentorId } = req.params;
    const chat = await Chat.findOne({
      participants: { $all: [userId, mentorId] }
    });
    if (chat) {
      res.json(chat.messages);
    } else {
      res.status(404).json({ message: "No chat history found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching chat history", error });
  }
});

module.exports = router;
