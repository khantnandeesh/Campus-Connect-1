import express from "express";
import {
  createChat,
  getUserChats,
  sendMessage,
  sendDocument,
  sendImage,
  getOnlineFriends,
  getUserFriends,
  deleteMessage, // Import deleteMessage
} from "../controllers/chat.controller.js";
import protectRoute from "../middlewares/protectRoute.js";
import { uploadMiddleware } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/", protectRoute, createChat); // Create a new chat
router.get("/", protectRoute, getUserChats); // Get all chats of a user
router.post("/message/:chatId", protectRoute, sendMessage); // Send a message in a chat
router.post("/document/:chatId", protectRoute, uploadMiddleware, sendDocument); // Send a document in a chat
router.post("/image/:chatId", protectRoute, uploadMiddleware, sendImage); // Send an image in a chat
router.delete("/message/:chatId/:messageId", protectRoute, deleteMessage); // Delete a message in a chat
router.get("/online-friends", protectRoute, getOnlineFriends); // Get online friends with recent messages
router.get("/friends", protectRoute, getUserFriends); // Get all friends of the user with recent messages and online status

export default router;
