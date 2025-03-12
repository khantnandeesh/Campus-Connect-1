import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../../lib/utils";
import { FileText, Trash2 } from "lucide-react";
import { deleteMessage } from "../../utils/personalChatService";
import { toast } from "react-hot-toast";

const ChatContainer = ({
  setSelectedUser,
  selectedUser,
  messages,
  setMessages,
  isMessagesLoading,
  authUser,
  onlineUsers,
}) => {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messageEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages?.length) {
      scrollToBottom("instant");
    }
  }, []);

  const handleMessageClick = (message) => {
    if (message.sender === authUser._id) {
      setSelectedMessage(message._id === selectedMessage ? null : message._id);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(selectedUser.chatId, messageId);
      setMessages(messages.filter((msg) => msg._id !== messageId));
      setSelectedMessage(null);
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          onlineUsers={onlineUsers}
        />
        <MessageSkeleton />
        <MessageInput selectedUser={selectedUser} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-[#0f172a]">
      <ChatHeader
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        onlineUsers={onlineUsers}
      />
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin 
          scrollbar-thumb-blue-600 scrollbar-track-transparent 
          scroll-smooth will-change-scroll overscroll-y-contain"
      >
        {messages.map((message, index) => (
          <div
            key={message._id}
            className={`flex items-start gap-2 animate-fade-in ${
              message.sender === authUser._id ? "flex-row-reverse" : "flex-row"
            }`}
            ref={index === messages.length - 1 ? messageEndRef : null}
          >
            <div className="flex-shrink-0">
              <div className="size-10 rounded-full overflow-hidden border-2 border-blue-500/30 shadow-lg shadow-blue-500/20">
                <img
                  src={
                    message.sender === authUser._id
                      ? authUser.avatar || "/avatar.png"
                      : selectedUser.avatar || "/avatar.png"
                  }
                  alt="profile pic"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div
              onClick={() => handleMessageClick(message)}
              className="relative cursor-pointer group"
            >
              <div
                className={`rounded-lg px-4 py-2 shadow-lg ${
                  message.sender === authUser._id
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-[#1e293b] text-gray-100 rounded-tl-none"
                }`}
              >
                {message.mediaUrl && (
                  <div className="mb-2">
                    {message.mediaUrl.includes("/image/") ? (
                      <img
                        src={message.mediaUrl}
                        alt="Media"
                        className="max-w-[200px] rounded-md hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(message.mediaUrl, "_blank")}
                      />
                    ) : (
                      <div
                        className="flex items-center gap-2 p-2 bg-blue-900/30 rounded-md cursor-pointer hover:bg-blue-900/50"
                        onClick={() => window.open(message.mediaUrl, "_blank")}
                      >
                        <FileText size={20} />
                        <span className="text-sm truncate">
                          Uploaded Document
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {message.content && (
                  <p className="break-words leading-relaxed">
                    {message.content}
                  </p>
                )}
              </div>
              {selectedMessage === message._id && (
                <button
                  onClick={() => handleDeleteMessage(message._id)}
                  className="absolute top-0 right-0 mt-2 mr-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <time className="text-xs text-gray-400 mt-1 px-2">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
          </div>
        ))}
      </div>
      <MessageInput selectedUser={selectedUser} />
    </div>
  );
};
export default ChatContainer;
