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
import { Server } from "socket.io";
import http from "http";
import StudyRoom from "./models/room.model.js";
import Chat from "./models/chat.model.js";
import Message from "./models/message.model.js";
import Group from "./models/group.model.js";
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
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
      console.log(`User joined chat: ${chatId}`);
    });

    // Handle personal chat messages
    socket.on("sendMessage", async ({ chatId, sender, content }) => {
      const message = new Message({ sender, content, chat: chatId });
      await message.save();

      await Chat.findByIdAndUpdate(chatId, {
        $push: { messages: message._id },
      });

      io.to(chatId).emit("newMessage", message); // Send to all in the chat
    });

    // Join group chat rooms
    socket.on("joinGroup", (groupId) => {
      socket.join(groupId);
      console.log(`User joined group: ${groupId}`);
    });

    // Handle group messages
    socket.on("sendGroupMessage", async ({ groupId, sender, content }) => {
      const message = new Message({ sender, content, group: groupId });
      await message.save();

      await Group.findByIdAndUpdate(groupId, {
        $push: { messages: message._id },
      });

      io.to(groupId).emit("newGroupMessage", message); // Broadcast to group members
    });

    // Handle pinned messages in groups
    socket.on("pinMessage", async ({ groupId, messageId }) => {
      await Group.findByIdAndUpdate(groupId, {
        $push: { pinnedMessages: messageId },
      });
      io.to(groupId).emit("messagePinned", messageId);
    });

    // Handle group announcements (can be global or private)
    socket.on("postAnnouncement", async ({ groupId, content, isGlobal }) => {
      const message = new Message({ content, group: groupId, isGlobal });
      await message.save();

      if (isGlobal) {
        io.emit("globalAnnouncement", message); // Send to all users
      } else {
        io.to(groupId).emit("groupAnnouncement", message); // Send to group members only
      }
    });

    // Handle poll voting updates
    socket.on("votePoll", async ({ pollId, optionIndex }) => {
      io.emit("pollUpdated", { pollId, optionIndex }); // Broadcast poll update
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

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
