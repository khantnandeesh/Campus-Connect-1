import express from "express";
import Chat from "../models/chat.model.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

// Fetch the user's chat inbox (all chats involving the user)
router.get("/inbox", protectRoute, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    // Find all chats where the user is either buyer or seller
    const chats = await Chat.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .populate("buyerId", "username")
      .populate("sellerId", "username")
      .populate({
        path: "messages",
        select: "text senderId read",
        options: { sort: { createdAt: -1 }, limit: 1 }, // Get the latest message
      })
      .sort({ updatedAt: -1 });

    // Format response
    const chatSummaries = chats.map((chat) => {
      const lastMessage =
        chat.messages.length > 0 ? chat.messages[0].text : "No messages yet";

      // Count unread messages for the logged-in user
      const unreadCount = chat.messages.filter(
        (msg) => msg.senderId.toString() !== userId && !msg.read
      ).length;

      return {
        _id: chat._id,
        buyerId: chat.buyerId._id.toString(),
        sellerId: chat.sellerId._id.toString(),
        buyer: chat.buyerId,
        seller: chat.sellerId,
        lastMessage,
        unreadCount,
      };
    });

    res.json(chatSummaries);
  } catch (error) {
    console.error("Error fetching chat inbox:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Fetch or create a chat between the user and a seller
// Endpoint: GET /api/chat/:sellerId
router.get("/:sellerId", protectRoute, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Find the chat between buyer and seller (in either order)
    let chat = await Chat.findOne({
      $or: [
        { buyerId: userId, sellerId: sellerId },
        { buyerId: sellerId, sellerId: userId },
      ],
    });

    // If no chat exists, create a new one
    if (!chat) {
      chat = new Chat({
        buyerId: userId,
        sellerId: sellerId,
        messages: [],
      });
      await chat.save();
    }

    res.json(chat);
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Send a new message
router.post("/send", protectRoute, async (req, res) => {
  try {
    const { chatId, senderId, receiverId, text } = req.body;
    if (!chatId || !senderId || !receiverId || !text) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create new message
    const message = { senderId, text, read: false };
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { $push: { messages: message }, updatedAt: Date.now() },
      { new: true }
    );

    if (!chat) return res.status(404).json({ error: "Chat not found" });

    // Emit event to notify receiver
    req.io.to(receiverId).emit("newMessage", { chatId, senderId, text });

    res.json({ success: true, message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Mark a message as read
router.put("/mark-read", protectRoute, async (req, res) => {
  try {
    const { chatId, messageId } = req.body;
    const userId = req.user?._id;
    if (!chatId || !messageId || !userId) {
      return res.status(400).json({ error: "Chat ID, Message ID, and User ID are required" });
    }

    // Find the chat by chatId
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    // Find the message by messageId
    const message = chat.messages.id(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Ensure the logged-in user is the receiver of the message (not the sender)
    if (message.senderId.toString() === userId.toString()) {
      return res.status(400).json({ error: "Sender cannot mark the message as read" });
    }

    // Mark the message as read
    message.read = true;
    await chat.save();

    // Emit event to notify the sender (optional)
    req.io.to(message.senderId.toString()).emit("messageRead", { chatId, messageId });

    res.json({ success: true, message });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
