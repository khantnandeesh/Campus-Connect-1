import StudyRoom from "../models/room.model.js";
import { v4 as uuidv4 } from "uuid";

// Create a new room
export const createRoom = async (req, res) => {
  try {
    const roomId = uuidv4();

    const existingRoom = await StudyRoom.findOne({ roomId });
    if (existingRoom) {
      return res.status(400).json({ message: "Room already exists" });
    }

    const newRoom = new StudyRoom({
      roomId,
      participants: [
        {
          userId: req.user?._id,
          username: req.user ? req.user.username : "Unknown",
        },
      ],
    });

    await newRoom.save();

    if (req.io) {
      req.io.emit("roomCreated", newRoom);
    }

    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating room", error });
  }
};

// Get room details
export const getRoom = async (req, res) => {
  const { roomId } = req.params;
  try {
    const room = await StudyRoom.findOne({ roomId })
    .populate('participants.userId', 'username')
      .populate('chatMessages.sender', 'username')
      .populate('tasks.createdBy', 'username');

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: "Error fetching room", error });
  }
};

// Join a room
export const joinRoom = async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user?._id;
  const username = req.user?.username;
  try {
    const room = await StudyRoom.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const alreadyInRoom = room.participants.find(
      (participant) => participant.userId.toString() === userId
    );
    if (!alreadyInRoom) {
      room.participants.push({ userId, username });
      await room.save();
    }

    req.io.to(roomId).emit("roomJoined", room);
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: "Error joining room", error });
  }
};

// Leave a room
export const leaveRoom = async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user?._id; 
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - User not authenticated" });
    }
  
    try {
      const room = await StudyRoom.findOne({ roomId });
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      const originalCount = room.participants.length;

      room.participants = room.participants.filter(
        (participant) => participant.userId.toString() !== userId.toString()
      );
 
      if (room.participants.length === originalCount) {
        return res.status(400).json({ message: "User not in room" });
      }
  
     
      // Handle empty room condition
      if (room.participants.length === 0) {
        await StudyRoom.deleteOne({ _id: room._id });
        req.io?.to(roomId).emit("roomClosed", { message: "Room closed" });
        return res.status(200).json({ message: "Left room and room removed" });
      }
  
      await room.save();
      req.io?.to(roomId).emit("roomLeft", room);
      res.status(200).json({ message: "Left room", room });
    } catch (error) {
      console.error("Error leaving room:", error);
      res.status(500).json({ message: "Error leaving room", error: error.message });
    }
  };

// Send Chat Message
export const sendMessage = async (req, res) => {
    const { roomId } = req.params;
    const { message } = req.body;
  
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  
      const room = await StudyRoom.findOne({ roomId });
      if (!room) return res.status(404).json({ message: "Room not found" });
  
      const newMessage = {
        message,
        sender: req.user._id,
        timestamp: new Date(),
      };
  
      room.chatMessages.push(newMessage);
      await room.save();
  
      // Populate the sender's information for all chat messages
      await room.populate('chatMessages.sender', 'username');
  
      // Extract the newly added message (now populated)
      const populatedMessage = room.chatMessages[room.chatMessages.length - 1];
  
      req.io.to(roomId).emit("newMessage", populatedMessage);
      res.status(201).json(populatedMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Error sending message", error });
    }
  };

// Add Task
export const addTask = async (req, res) => {
    const { roomId } = req.params;
    const { title } = req.body;
  
    try {
      const room = await StudyRoom.findOne({ roomId });
      if (!room) return res.status(404).json({ message: "Room not found" });
  
      const newTask = {
        title,
        createdBy: req.user ? req.user._id : null,
      };
  
      room.tasks.push(newTask);
      await room.save();
  
      // Get the newly added task from the room
      const addedTask = room.tasks[room.tasks.length - 1];
  
      // Populate the createdBy field so that it contains user details
      await room.populate("tasks.createdBy");
  
      req.io.to(roomId).emit("taskAdded", addedTask);
      res.status(201).json(addedTask);
    } catch (error) {
      res.status(500).json({ message: "Error adding task", error });
    }
  };
  

// Update Task (toggle completed)
export const updateTask = async (req, res) => {
  const { roomId } = req.params;
  const { taskId } = req.body;
  try {
    const room = await StudyRoom.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    const task = room.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    task.completed = !task.completed;
    await room.save();

    req.io.to(roomId).emit("taskUpdated", task);
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
};

// Delete Task
export const deleteTask = async (req, res) => {
  const { roomId, taskId } = req.params;

  try {
    const room = await StudyRoom.findOne({ roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.tasks = room.tasks.filter(
      (task) => task._id.toString() !== taskId
    );
    await room.save();

    req.io.to(roomId).emit("taskDeleted", taskId);
    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error });
  }
};
