import express from "express";
import {
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  sendMessage,
  addTask,
  updateTask,
  deleteTask,
} from "../controllers/room.controller.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

// HTTP Endpoints using controllers
router.get("/:roomId", protectRoute, getRoom);
router.post("/", protectRoute, createRoom);
router.post("/:roomId/join", protectRoute, joinRoom);
router.post("/:roomId/leave", protectRoute, leaveRoom);
//router.post("/:roomId/timer", protectRoute, updateTimer);
router.post("/:roomId/chat", protectRoute, sendMessage);
router.post("/:roomId/task", protectRoute, addTask);
router.post("/:roomId/task/:taskId", protectRoute, updateTask);
router.delete("/:roomId/task/:taskId", protectRoute, deleteTask);

export default router;
