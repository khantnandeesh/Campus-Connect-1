import express from "express";
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
import marketplaceRoutes from "./routes/marketplace.routes.js";
import chatRoutes from "./routes/chat.marketplace.routes.js";
import { Server } from "socket.io";
import http from "http";
import StudyRoom from "./models/room.model.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  },
});

// Add timer management
const activeTimers = new Map(); // Track active timers per room

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// Inject io into requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io Events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

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

    
    socket.on("setDuration", async ({ roomId, duration,mode }) => {
      try {
        const room = await StudyRoom.findOne({ roomId });
        if (!room) return;
        
        room.timer.duration = duration;
        room.timer.timeLeft = duration;
      room.timer.mode = mode;
        
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

  socket.on("toggleMode", async ({ roomId, mode , duration }) => {
    try {
      const room = await StudyRoom.findOne({ roomId });
      if (!room) return;

      room.timer.isRunning = false;
      room.timer.mode = mode;
      room.timer.duration =  duration;
      room.timer.timeLeft = duration;
      
      await room.save();
      io.to(roomId).emit("timerUpdated", room.timer);
    } catch (err) {
      console.error("Mode toggle error:", err);
    }
  });
};

  // Chat Events for direct messaging between buyer and seller
 const handleChatEvents = () => {
  socket.on("joinChat", ({ buyerId, sellerId }) => {
    // Create a consistent room name by sorting the IDs
    const chatRoom = [buyerId, sellerId].sort().join("-");
    socket.join(chatRoom);
    console.log(`User joined chat: ${chatRoom}`);
  });

  socket.on("join", (userId) => {
    socket.join(userId); // User joins their own room (userId)
    console.log(`User ${userId} joined their personal room`);
  });

  socket.on("sendMessage", (message) => {
    const { senderId, receiverId } = message;
    // Use the same room naming strategy
    const chatRoom = [senderId, receiverId].sort().join("-");
    io.to(chatRoom).emit("receiveMessage", message);
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

  handleStudyRoomEvents();
  handleQnAEvents();
  handleChatEvents();


  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
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
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/chat", chatRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});