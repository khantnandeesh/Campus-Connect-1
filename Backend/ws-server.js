import { WebSocketServer, WebSocket } from "ws";
import Chat from "./models/chat.model.js";

const wss = new WebSocketServer({ port: 3001 });
const clients = new Map();

wss.on("connection", (ws) => {
  let userId = null;

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Received WebSocket message:", data);

      switch (data.type) {
        case "join":
          userId = data.userId;
          clients.set(userId, ws);
          console.log(`User ${userId} joined the chat`);
          // Broadcast user joined status
          broadcastUserStatus(userId, true);
          break;

        case "message":
          const { sender, receiver, content, isMedia } = data;
          const newMessage = {
            sender,
            content,
            isMedia: isMedia || false,
            timestamp: new Date()
          };
          // Save to database
           Chat.findOneAndUpdate(
            { participants: { $all: [sender, receiver] } },
            {
              $push: { messages: newMessage },
              $set: { lastMessage: new Date() }
            },
            { new: true }
          );

          // Send to receiver if online
          const receiverWs = clients.get(receiver);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            console.log(`Sending message to receiver ${receiver}`);
            receiverWs.send(
              JSON.stringify({
                type: "message",
                sender,
                content,
                isMedia: isMedia || false,
                timestamp: newMessage.timestamp
              })
            );
          } else {
            console.log(`Receiver ${receiver} is not online`);
          }
          break;

        case "meeting_request":
          const { meetingId, title, description, date, time } = data;
          console.log(`Sending meeting request to receiver ${data.receiver}`);

          // Send to receiver if online
          const receiverWsForMeeting = clients.get(data.receiver);
          if (
            receiverWsForMeeting &&
            receiverWsForMeeting.readyState === WebSocket.OPEN
          ) {
            receiverWsForMeeting.send(
              JSON.stringify({
                type: "meeting_request",
                sender: data.sender,
                meetingId,
                title,
                description,
                date,
                time
              })
            );
          } else {
            console.log(
              `Receiver ${data.receiver} is not online for meeting request`
            );
          }
          break;

        case "meeting_response":
          const { accepted } = data;
          console.log(`Sending meeting response to receiver ${data.receiver}`);

          // Send to receiver if online
          const receiverWsForResponse = clients.get(data.receiver);
          if (
            receiverWsForResponse &&
            receiverWsForResponse.readyState === WebSocket.OPEN
          ) {
            receiverWsForResponse.send(
              JSON.stringify({
                type: "meeting_response",
                sender: data.sender,
                meetingId: data.meetingId,
                accepted
              })
            );
          } else {
            console.log(
              `Receiver ${data.receiver} is not online for meeting response`
            );
          }
          break;

        case "typing":
          const { userId: typingUserId, receiverId, isTyping } = data;
          console.log(
            `Typing status: User ${typingUserId} is ${
              isTyping ? "typing" : "not typing"
            } to ${receiverId}`
          );

          // Forward typing status to receiver
          const receiverWsForTyping = clients.get(receiverId);
          if (
            receiverWsForTyping &&
            receiverWsForTyping.readyState === WebSocket.OPEN
          ) {
            console.log(`Forwarding typing status to receiver ${receiverId}`);
            receiverWsForTyping.send(
              JSON.stringify({
                type: "typing",
                userId: typingUserId,
                isTyping
              })
            );
          } else {
            console.log(
              `Receiver ${receiverId} is not online for typing status`
            );
          }
          break;

        case "heartbeat":
          // Handle heartbeat to maintain connection
          ws.send(JSON.stringify({ type: "heartbeat", status: "ok" }));
          break;
      }
    } catch (error) {
      console.error("WebSocket Error:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: error.message
        })
      );
    }
  });

  ws.on("close", () => {
    if (userId) {
      clients.delete(userId);
      console.log(`User ${userId} left the chat`);
      // Broadcast user left status
      broadcastUserStatus(userId, false);
    }
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
  });
});

// Helper function to broadcast user status
function broadcastUserStatus(userId, isOnline) {
  const message = JSON.stringify({
    type: "status",
    userId,
    isOnline
  });

  console.log(
    `Broadcasting status: User ${userId} is ${isOnline ? "online" : "offline"}`
  );

  // Broadcast to all connected clients
  clients.forEach((client, clientId) => {
    if (client.readyState === WebSocket.OPEN) {
      console.log(`Sending status to client ${clientId}`);
      client.send(message);
    }
  });
}

console.log("WebSocket server running on port 3001");
