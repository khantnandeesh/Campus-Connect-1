import { WebSocketServer } from "ws";
import mongoose from "mongoose";
import Chat from "./models/Chat.js";
import dotenv from "dotenv";

dotenv.config();

const wss = new WebSocketServer({ port: 3001 });

// Store active connections with their user info
const clients = new Map();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("WebSocket Server: Connected to MongoDB"))
  .catch((err) =>
    console.error("WebSocket Server: MongoDB connection error:", err)
  );

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "join") {
        if (!data.userId || !data.mentorId) {
          ws.send(
            JSON.stringify({ type: "error", message: "Invalid join message" })
          );
          return;
        }
        // Store client info for this connection
        clients.set(ws, { userId: data.userId, mentorId: data.mentorId });

        // Load previous messages
        const previousMessages = await Chat.find({
          $or: [
            { userId: data.userId, mentorId: data.mentorId },
            { userId: data.mentorId, mentorId: data.userId }
          ]
        }).sort({ timestamp: 1 });

        ws.send(
          JSON.stringify({
            type: "previous_messages",
            messages: previousMessages
          })
        );
      } else if (data.type === "chat") {
        const clientInfo = clients.get(ws);
        if (!clientInfo) {
          ws.send(
            JSON.stringify({ type: "error", message: "Not joined to chat" })
          );
          return;
        }

        const newMessage = new Chat({
          userId: clientInfo.userId,
          mentorId: clientInfo.mentorId,
          message: data.message,
          timestamp: new Date(),
          messageType: data.messageType || "text",
          imageUrl: data.imageUrl
        });

        await newMessage.save();

        // Broadcast to relevant clients
        wss.clients.forEach((client) => {
          const recipientInfo = clients.get(client);
          if (
            recipientInfo &&
            ((recipientInfo.userId === clientInfo.userId &&
              recipientInfo.mentorId === clientInfo.mentorId) ||
              (recipientInfo.userId === clientInfo.mentorId &&
                recipientInfo.mentorId === clientInfo.userId))
          ) {
            client.send(
              JSON.stringify({
                type: "chat",
                message: newMessage
              })
            );
          }
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({ type: "error", message: "Internal server error" })
      );
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
  });
});

console.log("WebSocket server is running on ws://localhost:3001");
