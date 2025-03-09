import { WebSocketServer } from "ws";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store active connections
const clients = new Map();

wss.on("connection", (ws) => {
  console.log("New client connected to chat");

  ws.on("message", (data) => {
    try {
      // Convert Buffer to string and trim any whitespace
      const message = Buffer.from(data).toString().trim();
      console.log("Raw message received:", message); // Debug log

      const parsedMessage = JSON.parse(message);
      console.log("Parsed message:", parsedMessage); // Debug log

      switch (parsedMessage.type) {
        case "join":
          // Store user info with the connection
          clients.set(ws, {
            userId: parsedMessage.userId,
            chatRoom: `${parsedMessage.mentorId}_${parsedMessage.userId}`
          });
          console.log(
            `User ${parsedMessage.userId} joined chat with mentor ${parsedMessage.mentorId}`
          );

          // Send confirmation back to client
          ws.send(
            JSON.stringify({
              type: "system",
              content: "Connected to chat room",
              timestamp: new Date().toISOString()
            })
          );
          break;

        case "message":
          const sender = clients.get(ws);
          if (sender) {
            const messageToSend = {
              type: "message",
              sender: parsedMessage.sender,
              content: parsedMessage.content,
              timestamp: new Date().toISOString()
            };

            // Broadcast to all clients in the same chat room
            wss.clients.forEach((client) => {
              const receiver = clients.get(client);
              if (receiver && receiver.chatRoom === sender.chatRoom) {
                client.send(JSON.stringify(messageToSend));
              }
            });
          }
          break;

        default:
          console.log("Unknown message type:", parsedMessage.type);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      // Send error back to client
      try {
        ws.send(
          JSON.stringify({
            type: "error",
            content: "Failed to process message",
            timestamp: new Date().toISOString()
          })
        );
      } catch (e) {
        console.error("Failed to send error message:", e);
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Client disconnected from chat");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
