import express from "express";
import {
  createChat,
  getUserChats,
  sendMessage,
} from "../controllers/chatController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.post("/", protectRoute, createChat); // Create a new chat
router.get("/", protectRoute, getUserChats); // Get all chats of a user
router.post("/message/:chatId", protectRoute, sendMessage); // Send a message in a chat

export default router;
