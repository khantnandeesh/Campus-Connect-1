import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";

const ChatInbox = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id;
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchChats = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/chatMarket/inbox?userId=${userId}`,
          { withCredentials: true }
        );
        setChats(response.data);
      } catch (error) {
        console.error("Error fetching chat inbox:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-900 to-black min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-900 to-black min-h-screen text-white">
      <Toaster position="top-right" reverseOrder={false} />
      
      <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 drop-shadow-lg text-center mb-8">
        Chat Inbox
      </h2>

      {chats.length === 0 ? (
        <div className="flex flex-col justify-center items-center text-gray-400 space-y-4">
          <p className="text-xl">No conversations yet.</p>
          <Link 
            to="/marketplace" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl mx-auto">
          {chats.map((chat) => {
            const otherParty = chat.buyerId === userId ? chat.seller : chat.buyer;
            return (
              <Link
                to={`/chat/${otherParty._id}`}
                key={chat._id}
                className="block bg-gray-800 p-4 rounded-lg shadow hover:bg-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold">
                      {otherParty.username[0].toUpperCase()}
                    </div>
                    <p className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                      {otherParty.username}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="bg-red-500 rounded-full px-3 py-1 text-sm animate-bounce">
                      {chat.unreadCount} New
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatInbox;
