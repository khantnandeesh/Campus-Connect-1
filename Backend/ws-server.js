import { WebSocketServer, WebSocket } from "ws";
import Chat from "./models/chat.model.js";

const wss = new WebSocketServer({ port:process.env.PORT });
const clients = new Map();



let userToSocket=new Map();
let socketToUser=new Map();
let receiverSocket=null;
let newReceiverSocket=null;
let currentStatus={}









wss.on("connection", (ws) => {
  let userId = null;

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);


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



        case "start":
        
           {
            console.log("start received!");
            
             const {roomId,userId}=data.data;
           
            let insertIndex;
            socketToUser.set(ws,userId);
            userToSocket.set(userId,ws);
            if(currentStatus[roomId]==undefined){
              currentStatus[roomId]=[];
              insertIndex=0;
              currentStatus[roomId].push(userId);
            }
            else{
                insertIndex=currentStatus[roomId].length;
                currentStatus[roomId].push(userId);
            } 
   
            let string =JSON.stringify({
              type:"add-peer",
              data:{
                roomId:roomId,
                index:insertIndex,
              }
            })
            
            receiverSocket.send(string)
           console.log(userToSocket.get(userId))
            break;
          }
        
        case "add-peerA":
         { 
          
            let {index,roomId}=data.data;
            
            let socket=userToSocket.get(currentStatus[roomId][index]) 
            socket.send(JSON.stringify({
              type:"start" })
            )  

            break;
        } 


        case "offer":

          {
        
            let {roomId,offer,userId}=data.data;
            let index=currentStatus[roomId].indexOf(userId);
            receiverSocket.send(JSON.stringify({
              type:"offer",
              data:{
                roomId,
                index,
                offer
              }
            })
            )


            break;
          }


        case "answer":
          {

            let {roomId,index,answer}=data.data;
            let socket=userToSocket.get(currentStatus[roomId][index]);
            socket.send(JSON.stringify({
              type:"answerI",
              data:{
                answer
              }
            })
            )


            break;
          }

        case "receiver":
          {
            console.log("receiver received!");
            receiverSocket=ws;
            break;
          }

        case "ice-candidate":
          {
            let {roomId,userId,candidate}=data.data;
            let index=currentStatus[roomId].indexOf(userId);
            receiverSocket.send(JSON.stringify({
              type:"ice-candidate-main",
              data:{
                roomId,
                index,
                candidate
              }
            })
            )
            break;
          }
        case "tickle" :
          {
            let {candidate,roomId,index}=data.data;
            let socket=userToSocket.get(currentStatus[roomId][index]);
            socket.send(JSON.stringify({
              type:"tickleR",
              data:{
                candidate
              }
            }))
            break;
          }

        case "offerI":
          {
            console.log("offerI received!");
            let {roomId,index,offer}=data.data;
            if(newReceiverSocket==null){
              newReceiverSocket=ws;
            }
            let socket=userToSocket.get(currentStatus[roomId][index]);
            socket.send(JSON.stringify({
              type:"offerI",
              data:{
                offer
              }
            })
            
            )
            console.log("offerI sent!");

            break;
          }


          case "answer-secondary":
            {
              let {roomId,userId,answer}=data.data;
              let index=currentStatus[roomId].indexOf(userId);
              newReceiverSocket.send(JSON.stringify({
                type:"answer-secondary",
                data:{
                  roomId,
                  index,
                  answer
                }
              })
              )
              break;
              
            }

          case "ice-candidate-medi":
            {
              let {roomId,index,candidate}=data.data;
              let socket=userToSocket.get(currentStatus[roomId][index]);
              socket.send(JSON.stringify({
                type:"ice-candidate-medi",
                data:{
                  
                  candidate
                }
              })
              )

              break;
            }

          case 'ice-candidate-forward':
            {
              let {roomId,userId,candidate}=data.data;
              let index=currentStatus[roomId].indexOf(userId);
              newReceiverSocket.send(JSON.stringify({
                type:"ice-candidate-forward",
                data:{
                  roomId,
                  index,
                  candidate
                }
              })
              )
              break;
              
            }



            
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




    //for group video call from now on 



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
