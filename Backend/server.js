import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import collegeRoutes from "./routes/collegeRoutes.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173", // Replace with your frontend URL
    credentials: true, // Allow credentials (cookies) to be sent
  })
);

connectDB();

app.use("/auth", authRoutes);
app.use("/college", collegeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
