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
import { Server } from "socket.io";
import http from "http";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
});

//Routes
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true, // Allow credentials (cookies) to be sent
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
      reply,
    });
  });

  socket.on("load_more_replies", ({ answerId, cursor, limit }) => {
    socket.emit("replies_page_request", { answerId, cursor, limit });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

connectDB();

app.use("/auth", authRoutes);
app.use("/college", collegeRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answers", answerRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
