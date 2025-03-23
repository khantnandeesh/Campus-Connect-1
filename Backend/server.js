import express from "express";
// import helmet from "helmet"; // Added for security headers
import bodyParser from "body-parser";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import collegeRoutes from "./routes/collegeRoutes.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import questionRoutes from "./routes/question.routes.js";
import answerRoutes from "./routes/answer.routes.js";
import roomRoutes from "./routes/room.routes.js";
import userRoutes from "./routes/user.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import chatRoutes from "./routes/chat.personal.routes.js"; // Import chat routes
import { Server } from "socket.io";
import http from "http";
import StudyRoom from "./models/room.model.js";
import groupRoutes from "./routes/groupChat.routes.js";
import cloudinary from "./config/cloudinary.js"; // Ensure Cloudinary is imported
import { log } from "console";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true, // Add this line
  },
});

// // Security middleware
// app.use(helmet());

// Add timer management
const activeTimers = new Map(); // Track active timers per room
const users = new Map(); // Track online users

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true, // Add this line
  })
);

// Make io and cloudinary available throughout the app
app.set("io", io);
app.set("cloudinary", cloudinary); // Add this line

// Inject io and cloudinary into requests
app.use((req, res, next) => {
  req.io = io;
  req.cloudinary = cloudinary; // Add this line
  next();
});

// Socket.io Events
io.on("connection", (socket) => {
  // console.log("User connected:", socket.id);
  console.log("User connected:", socket.id);
  // Handle user online status
  socket.on("user-online", (userId) => {
    users.set(userId, socket.id);
    socket.userId = userId; // Store userId in socket object
    io.emit("online-users", Array.from(users.keys()));
  });

  socket.on("disconnect", () => {
    log("User disconnected:", socket.id);
    if (socket.userId) {
      users.delete(socket.userId);
      io.emit("online-users", Array.from(users.keys()));
    }
  });

  // Study Room Events
  const handleStudyRoomEvents = () => {
    socket.on("joinRoom", async (roomId) => {
      try {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);

        // Send current room state
        const room = await StudyRoom.findOne({ roomId });
        if (room) {
          socket.emit("timerUpdated", room.timer);
          socket.emit("participantsUpdated", room.participants);
          socket.emit("tasksUpdated", room.tasks);
          socket.emit("messagesUpdated", room.chatMessages);
        }
      } catch (err) {
        console.error("Join room error:", err);
      }
    });

    socket.on("setDuration", async ({ roomId, duration }) => {
      try {
        const room = await StudyRoom.findOne({ roomId });
        if (!room) return;

        room.timer.duration = duration;
        if (!room.timer.isRunning) {
          room.timer.timeLeft = duration;
        }

        await room.save();
        io.to(roomId).emit("timerUpdated", room.timer);
      } catch (err) {
        console.error("Duration update error:", err);
      }
    });

    // startTimer handler
    socket.on("startTimer", async (roomId) => {
      try {
        if (activeTimers.has(roomId)) return;

        const room = await StudyRoom.findOne({ roomId });
        if (!room || room.timer.timeLeft <= 0) return;

        // Only reset timeLeft if timer is expired
        if (room.timer.timeLeft <= 0) {
          room.timer.timeLeft = room.timer.duration;
        }

        room.timer.isRunning = true;
        await room.save();

        const interval = setInterval(async () => {
          const updatedRoom = await StudyRoom.findOne({ roomId });
          if (!updatedRoom) {
            clearInterval(interval);
            activeTimers.delete(roomId);
            return;
          }

          updatedRoom.timer.timeLeft--;

          if (updatedRoom.timer.timeLeft <= 0) {
            updatedRoom.timer.isRunning = false;
            clearInterval(interval);
            activeTimers.delete(roomId);
          }

          await updatedRoom.save();
          io.to(roomId).emit("timerUpdated", updatedRoom.timer);
        }, 1000);

        activeTimers.set(roomId, interval);
        io.to(roomId).emit("timerUpdated", room.timer);
      } catch (err) {
        console.error("Start timer error:", err);
      }
    });

    // Add this to your socket.io server code
    socket.on("stopTimer", async (roomId) => {
      try {
        const room = await StudyRoom.findOne({ roomId });
        if (!room) return;

        // Clear existing timer
        if (activeTimers.has(roomId)) {
          clearInterval(activeTimers.get(roomId));
          activeTimers.delete(roomId);
        }

        room.timer.isRunning = false;
        await room.save();

        io.to(roomId).emit("timerUpdated", room.timer);
      } catch (err) {
        console.error("Stop timer error:", err);
      }
    });
  };

  // Question/Answer Events (existing functionality)
  const handleQnAEvents = () => {
    socket.on("join_question", (questionId) => {
      socket.join(`question_${questionId}`);
    });

    socket.on("leave_question", (questionId) => {
      socket.leave(`question_${questionId}`);
    });

    socket.on("new_question", (question) => {
      io.emit("question_added", question);
    });

    socket.on("new_answer", (answer) => {
      io.to(`question_${answer.question}`).emit("answer_added", answer);
    });

    socket.on("new_reply", ({ answerId, reply }) => {
      io.to(`question_${reply.question}`).emit("reply_added", {
        answerId,
        reply,
      });
    });
  };

  //Chat features
  const handleChatEvents = () => {
    // Join personal chat rooms
    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
      // console.log(`User ${socket.userId} joined chat: ${chatId}`);
    });

    // Join group chat rooms
    socket.on("joinGroupRoom", (groupId) => {
      socket.join(groupId);
      // console.log(`User ${socket.userId} joined group: ${groupId}`);
    });

    // Handle personal chat messages
    socket.on("sendMessage", async ({ chatId, message }) => {
      try {
        // Broadcast the message to all users in the chat room except sender
        socket.to(chatId).emit("newMessage", {
          _id: message._id,
          sender: message.sender,
          content: message.content,
          mediaUrl: message.mediaUrl,
          createdAt: message.createdAt,
          chat: chatId,
        });
      } catch (error) {
        console.error("Error broadcasting message:", error);
      }
    });

    // Handle group chat messages
    socket.on("sendGroupMessage", async ({ groupId, message }) => {
      try {
        // Broadcast the message to all users in the group room except sender

        socket.to(groupId).emit("newGroupMessage", {
          _id: message._id,
          sender: message.sender,
          content: message.content,
          mediaUrl: message.mediaUrl,
          createdAt: message.createdAt,
          group: groupId,
        });
      } catch (error) {
        console.error("Error broadcasting group message:", error);
      }
    });

    // Leave chat room when user switches chat
    socket.on("leaveChat", (chatId) => {
      socket.leave(chatId);
      console.log(`User ${socket.userId} left chat: ${chatId}`);
    });

    // Handle typing status
    socket.on("typing", ({ chatId, userId }) => {
      socket.to(chatId).emit("userTyping", userId);
    });

    socket.on("stopTyping", ({ chatId, userId }) => {
      socket.to(chatId).emit("userStoppedTyping", userId);
    });
  };

  handleStudyRoomEvents();
  handleQnAEvents();
  handleChatEvents();

  socket.on("disconnect", () => {
    // console.log("User disconnected:", socket.id);
    // Cleanup any room-specific timers if needed
  });
});

// Database Connection
connectDB();

// Routes
app.use("/auth", authRoutes);
app.use("/college", collegeRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/chats", chatRoutes); // Add chat routes
app.use("/api/groups", groupRoutes); // Add chat routes

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
