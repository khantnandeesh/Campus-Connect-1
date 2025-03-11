import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import collegeRoutes from "./routes/collegeRoutes.js";
import mentorRoutes from "./routes/mentorRoutes.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import questionRoutes from "./routes/question.routes.js";
import answerRoutes from "./routes/answer.routes.js";
import { Server } from "socket.io";
import http from "http";
import adminRoutes from "./routes/adminRoutes.js";
import setupWebSocketServer from "./websocket/chatServer.js";
import userRoutes from "./routes/userRoutes.js";


dotenv.config();

const app = express();
const server = setupWebSocketServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

// Middleware
app.use(cookieParser());
app.use(express.json());

// Configure CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Room management
  socket.on("join_question", (questionId) => {
    socket.join(`question_${questionId}`);
  });

  socket.on("leave_question", (questionId) => {
    socket.leave(`question_${questionId}`);
  });

  // Questions
  socket.on("new_question", (question) => {
    io.emit("question_added", question);
  });

  socket.on("load_more_questions", ({ page, limit }) => {
    socket.emit("questions_page_request", { page, limit });
  });

  // Answers
  socket.on("new_answer", (answer) => {
    io.to(`question_${answer.question}`).emit("answer_added", answer);
  });

  socket.on("load_more_answers", ({ questionId, cursor, limit }) => {
    socket.emit("answers_page_request", { questionId, cursor, limit });
  });

  // Replies
  socket.on("new_reply", ({ answerId, reply }) => {
    io.to(`question_${reply.question}`).emit("reply_added", {
      answerId,
      reply
    });
  });

  socket.on("load_more_replies", ({ answerId, cursor, limit }) => {
    socket.emit("replies_page_request", { answerId, cursor, limit });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Routes
app.use("/auth", authRoutes);
app.use("/college", collegeRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
// app.use("/chat", chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

connectDB();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
