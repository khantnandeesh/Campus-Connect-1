import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";

const SERVER_URL = "http://localhost:3000";

const SellerChatPage = () => {
  const { sellerId } = useParams();
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id;

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");

  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetching chat or creating a new one
  useEffect(() => {
    if (!userId) return;

    if (userId === sellerId) {
      setError("You cannot chat with yourself.");
      return;
    }

    // Connect socket with credentials
    socket.current = io(SERVER_URL, { withCredentials: true });

    // Join the chat room based on the buyer and seller IDs
    socket.current.emit("joinChat", { buyerId: userId, sellerId });

    // Listen for incoming messages
    socket.current.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Fetch the chat or create it if it doesn't exist
    const fetchChat = async () => {
      try {
        const response = await axios.get(`${SERVER_URL}/api/chat/${sellerId}`, {
          withCredentials: true,
        });

        if (response.data && response.data._id) {
          setChat(response.data);
          setMessages(response.data.messages);
        } else {
          // Handle case if chat is not found
          setChat(null);
          setMessages([]);
        }
      } catch (err) {
        console.error("Error fetching chat:", err);
        setError("Error fetching chat messages.");
      }
    };

    fetchChat();

    return () => {
      socket.current.disconnect();
    };
  }, [userId, sellerId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || userId === sellerId) {
      setError("Invalid message or you cannot chat with yourself.");
      return;
    }
    setError("");

    // Ensure we have a valid chat before sending
    if (!chat || !chat._id) {
      setError("Chat not found. Please try again later.");
      return;
    }

    const messageData = {
      chatId: chat._id, // Include chatId as required by the backend
      senderId: userId,
      receiverId: sellerId,
      text: newMessage,
    };

    try {
      // Send the message using the backend route
      await axios.post(`${SERVER_URL}/api/chat/send`, messageData, {
        withCredentials: true,
      });

      // Emit the new message to the receiver through the socket
      socket.current.emit("sendMessage", messageData);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Error sending message. Please try again.");
    }
  };

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 text-lg font-semibold flex items-center justify-center shadow-md">
        Chat with Seller
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : messages.length > 0 ? (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-3 rounded-xl max-w-[75%] shadow-md text-white ${
                  msg.senderId === userId ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-center">No messages yet.</div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input Box */}
      {!error && (
        <div className="p-4 bg-gray-800 border-t border-gray-700 flex items-center gap-2 shadow-md">
          <input
            type="text"
            className="flex-1 p-3 bg-gray-700 text-white border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition duration-200"
          >
            🚀
          </button>
        </div>
      )}
    </div>
  );
};

export default SellerChatPage;
