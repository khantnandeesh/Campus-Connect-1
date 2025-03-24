import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Link } from "react-router-dom";

const ChatInbox = () => {
  const user = useSelector((state) => state.auth.user);
  const userId = user?._id;
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchChats = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/chat/inbox?userId=${userId}`, {
          withCredentials: true,
        });
        setChats(response.data);
      } catch (error) {
        console.error("Error fetching chat inbox:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [userId]);

  if (loading) return <p className="text-gray-400 text-center">Loading chats...</p>;
  if (chats.length === 0) return <p className="text-gray-400 text-center">No conversations yet.</p>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h2 className="text-3xl font-bold mb-6 text-center">Chat Inbox</h2>
      <div className="space-y-4">
        {chats.map((chat) => {
          // Determine the other party in the chat
          const otherParty = chat.buyerId === userId ? chat.seller : chat.buyer;
          return (
            <Link
              to={`/chat/${otherParty._id}`}
              key={chat._id}
              className="block bg-gray-800 p-4 rounded-lg shadow hover:bg-gray-700 transition-colors flex items-center justify-between"
            >
              <p className="text-xl font-semibold">{otherParty.username}</p>
              {chat.unreadCount > 0 && (
                <span className="bg-red-500 rounded-full px-3 py-1 text-sm">{chat.unreadCount}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ChatInbox;
