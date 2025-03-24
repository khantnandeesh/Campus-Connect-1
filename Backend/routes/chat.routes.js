import express from "express";
import { getChatHistory, sendMessage } from "../controllers/chat.controller.js";
import verifyToken from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/:userId/:receiverId", verifyToken, getChatHistory);
router.post("/send", verifyToken, sendMessage);

export default router;
