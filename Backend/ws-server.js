import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./models/user.model.js";
import MentorApplication from "./models/MentorApplication.js";
import Chat from "./models/chat.model.js";
dotenv.config();

const wss = new WebSocketServer({ port: 3001 });

// Store online users and their socket connections
const onlineUsers = new Map(); 

// // Send ping to check active connections
// setInterval(() => {
//     for (const [userId, ws] of onlineUsers.entries()) {
//         if (ws.readyState != ws.OPEN) {
//             // Set a timeout to remove user if no pong received
//             const timeout = setTimeout(() => {
//                 if (onlineUsers.has(userId)) {
//                     onlineUsers.delete(userId);
//                     console.log(`Removed unresponsive user ${userId}`);
//                 }
//               }, 2000); // Wait 5 seconds for pong
//               console.log("interval started");
              
//             // Send ping and handle pong response
//             ws.send("ping");
//            ws.on("message", (message) => {
//             if (message === "pong") {
//                 clearTimeout(timeout); // Clear timeout since user responded
//             }
//            });
//         }
//     }
// }, 1000); // Check every 30 seconds




wss.on("connection", async (ws) => {
   

    console.log("Current online users:");
   
  

    ws.on("message", async (message) => {
        const data = JSON.parse(message);
        const { type, content } = data;
      console.log(data);
      
        if (type === "online") {
          for (const [userId, socket] of onlineUsers.entries()) {
            socket.send(JSON.stringify({ type: "get-statusR", content: { _id: userId} }));
        }

            const { _id } = content;
            onlineUsers.set( _id, ws);
            console.log(`User ${_id} logged in`);
            ws.send(JSON.stringify({ type: "onlineR", content: { status: "online" } }));
        } else if (type === "offline") {
            const { _id } = content;
            onlineUsers.delete(_id);
            console.log(`User ${_id} logged out`);
            ws.send(JSON.stringify({ type: "offlineR", content: { status: "offline" } }));
        }
        else if (type === "get-status") {
            const { _id } = content;
            const isOnline = onlineUsers.has(_id);
            console.log("status requested" + _id + " " + isOnline);


            ws.send(JSON.stringify({ type: "get-statusR", content: { _id: _id, online: isOnline } }));
        }
        else if(type=='message'){
            const { type, sender,receiver,data,timestamp } = content;
            let senderSocket=onlineUsers.get(sender);
            let receiverSocket=onlineUsers.get(receiver);

            if(receiverSocket){
                receiverSocket.send(JSON.stringify({ type: "messageR", content: { type, sender,data,timestamp } }));
            }
            let chat=new Chat({
                participants:[sender,receiver],
                messages:[{type,sender,data,timestamp}]
            });
             chat.save().then(()=>{
                console.log("message saved");
             }).catch((err)=>{
                console.log(err);
             });
            
        }
    })
    ws.onclose = () => {
        console.log("Client disconnected");
        const userId = Array.from(onlineUsers.keys()).find(id => onlineUsers.get(id) === ws);
        if (userId) {
            onlineUsers.delete(userId);
            console.log(`User ${userId} logged out`);
        }
    }
    
});

wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
});
