import express from 'express';
import {
    createRoom,
    getRoom,
    leaveRoom,
    joinRoom,
    updateTimer,
    sendMessage,
    addTask,
    updateTask,
    deleteTask
} from '../controllers/room.controller.js';
import protectRoute from '../middlewares/protectRoute.js';

const router = express.Router();

// Get room details
router.get('/room/:roomId', protectRoute , getRoom);

// Create a new room
router.post('/room', protectRoute , createRoom);

// Join a room
router.post('/room/:roomId/join', protectRoute , joinRoom);

// Leave a room
router.post('/room/:roomId/leave', protectRoute , leaveRoom);

// Start/stop the Pomodoro timer
router.post('/room/:roomId/timer', protectRoute , updateTimer);

// Create a task in the room
router.post('/room/:roomId/task', protectRoute , addTask);

// Update a task in the room
router.post('/room/:roomId/task/:taskId', protectRoute , updateTask);

// Delete a task from the room
router.delete('/room/:roomId/task/:taskId', protectRoute , deleteTask);

// Send a chat message in the room
router.post('/room/:roomId/chat', protectRoute , sendMessage);

export default router;