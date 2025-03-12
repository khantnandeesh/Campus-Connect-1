import { useState, useEffect } from "react";
import { socket } from "../utils/personalChatService";
import Sidebar from "../components/chatComponents/Sidebar";
import NoChatSelected from "../components/chatComponents/NoChatSelected";
import ChatContainer from "../components/chatComponents/ChatContainer";
import { getUserChats, getOnlineFriends } from "../utils/personalChatService";

const ChatPage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [authUser, setAuthUser] = useState({
    _id: "authUserId",
    profilePic: "/avatar.png",
  });

  useEffect(() => {
    socket.on("newMessage", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on("deleteMessage", (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    });

    return () => {
      socket.off("newMessage");
      socket.off("deleteMessage");
    };
  }, []);

  useEffect(() => {
    if (selectedUser) {
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      setAuthUser(loggedInUser);
      setIsMessagesLoading(true);
      getUserChats(selectedUser._id)
        .then((chats) => {
          const userChat = chats.find((chat) =>
            chat.participants.some((p) => p._id === selectedUser._id)
          );

          if (userChat) {
            socket.emit("joinChat", userChat._id);
            setMessages(userChat?.messages || []);
          }
          setIsMessagesLoading(false);
        })
        .catch(() => setIsMessagesLoading(false));
    }
  }, [selectedUser]);

  useEffect(() => {
    getOnlineFriends().then(setOnlineUsers);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-[#0f172a]/90 backdrop-blur-sm rounded-xl shadow-2xl shadow-blue-500/10 w-full max-w-6xl h-[calc(100vh-8rem)] border border-blue-500/20">
          <div className="flex h-full rounded-xl overflow-hidden">
            <Sidebar
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              onlineUsers={onlineUsers}
              setOnlineUsers={setOnlineUsers}
            />
            {!selectedUser ? (
              <NoChatSelected />
            ) : (
              <ChatContainer
                setSelectedUser={setSelectedUser}
                selectedUser={selectedUser}
                messages={messages}
                setMessages={setMessages}
                isMessagesLoading={isMessagesLoading}
                authUser={authUser}
                onlineUsers={onlineUsers}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatPage;
