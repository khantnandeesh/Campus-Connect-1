import express from "express";
import multer from "multer";
import {
  sendMessage,
  getGroupMessages,
} from "../controllers/messageController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

// Multer setup for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.post("/:groupId", protectRoute, upload.single("media"), sendMessage); // Send message in a group
router.get("/:groupId", protectRoute, getGroupMessages); // Get messages from a group

export default router;
