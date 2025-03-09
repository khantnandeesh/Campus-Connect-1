import { WebSocketServer } from "ws";
import http from "http";

const setupWebSocketServer = (app) => {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // Store active connections
  const clients = new Map();

  wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (message) => {
      try {
;
        const data =JSON.parse(message);

        switch (data.type) {
          case "join":
            // Store user info with the connection
            clients.set(ws, {
              userId: data.userId,
              chatRoom: `${data.mentorId}_${data.userId}`
            });
            break;

          case "message":
            // Broadcast to specific chat room
            const sender = clients.get(ws);
            if (sender) {
              wss.clients.forEach((client) => {
                const receiver = clients.get(client);
                if (receiver && receiver.chatRoom === sender.chatRoom) {
                  client.send(
                    JSON.stringify({
                      type: "message",
                      sender: data.sender,
                      content: data.content,
                      timestamp: new Date().toISOString()
                    })
                  );
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      console.log("Client disconnected");
    });
  });

  return server;
};

export default setupWebSocketServer;
