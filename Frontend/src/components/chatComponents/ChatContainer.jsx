import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../../lib/utils";
import { FileText, Trash2, ChevronDown, Pin, BarChart2 } from "lucide-react";
import { deleteMessage } from "../../utils/personalChatService";
import {
  deleteGroupMessage,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
} from "../../utils/groupService";
import { toast } from "react-hot-toast";
import { socket } from "../../utils/groupService";
import PollMessage from "./PollMessage";

const ChatContainer = ({
  setSelectedUser,
  selectedUser,
  setSelectedGroup,
  selectedGroup,
  messages,
  setMessages,
  isMessagesLoading,
  authUser,
  onlineUsers,
}) => {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showActionsFor, setShowActionsFor] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const messageEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const messageRefs = useRef({});

  const scrollToBottom = (behavior = "smooth") => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior });
    }
  };

  const scrollToMessage = (messageId) => {
    if (messageRefs.current[messageId]) {
      messageRefs.current[messageId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      // Highlight effect
      messageRefs.current[messageId].classList.add("bg-blue-500/20");
      setTimeout(() => {
        messageRefs.current[messageId]?.classList.remove("bg-blue-500/20");
      }, 2000);
    }
  };

  useEffect(() => {
    scrollToBottom();
    if (selectedGroup) setIsAdmin(selectedGroup.admins?.includes(authUser._id));
  }, [messages]);

  useEffect(() => {
    if (messages?.length) {
      scrollToBottom("instant");
    }
  }, []);

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    if (selectedGroup) {
      socket.on("newGroupMessage", handleNewMessage);
      socket.on("deleteGroupMessage", (messageId) => {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg._id !== messageId)
        );
      });
    }
    return () => {
      if (selectedGroup) {
        socket.off("newGroupMessage", handleNewMessage);
      }
    };
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedGroup) {
      getPinnedMessages(selectedGroup._id)
        .then((messages) => setPinnedMessages(messages))
        .catch((error) =>
          console.error("Error fetching pinned messages:", error)
        );
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedGroup) {
      socket.on("messagePinned", ({ messageId, message }) => {
        setPinnedMessages((prev) => [...prev, message]);
      });

      socket.on("messageUnpinned", (messageId) => {
        setPinnedMessages((prev) =>
          prev.filter((msg) => msg._id !== messageId)
        );
      });

      return () => {
        socket.off("messagePinned");
        socket.off("messageUnpinned");
      };
    }
  }, [selectedGroup]);

  const handleMessageClick = (message) => {
    // Use optional chaining to check the sender
    if (message.sender?._id === authUser._id) {
      setSelectedMessage(selectedMessage === message._id ? null : message._id);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      if (selectedUser) {
        await deleteMessage(selectedUser.chatId, messageId);
      } else if (selectedGroup) {
        await deleteGroupMessage(selectedGroup._id, messageId);
      }
      setMessages(messages.filter((msg) => msg._id !== messageId));
      setSelectedMessage(null);
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handlePin = async (messageId) => {
    try {
      await pinMessage(selectedGroup._id, messageId);
      setShowActionsFor(null);
    } catch (error) {
      toast.error("Failed to pin message");
    }
  };

  const handleUnpin = async (messageId) => {
    try {
      await unpinMessage(selectedGroup._id, messageId);
      setShowActionsFor(null);
    } catch (error) {
      toast.error("Failed to unpin message");
    }
  };

  const groupedMessages = messages.reduce((acc, message) => {
    const dateString = new Date(message.createdAt).toLocaleDateString();
    if (!acc[dateString]) acc[dateString] = [];
    acc[dateString].push(message);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedMessages).sort(
    (a, b) => new Date(a) - new Date(b)
  );

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader
          selectedUser={selectedUser}
          selectedGroup={selectedGroup}
          setSelectedUser={setSelectedUser}
          setSelectedGroup={setSelectedGroup}
          onlineUsers={onlineUsers}
        />
        <MessageSkeleton />
        <MessageInput
          selectedUser={selectedUser}
          selectedGroup={selectedGroup}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-[#0f172a]">
      <ChatHeader
        selectedUser={selectedUser}
        selectedGroup={selectedGroup}
        setSelectedUser={setSelectedUser}
        setSelectedGroup={setSelectedGroup}
        onlineUsers={onlineUsers}
      />

      {/* Pinned Messages Section */}
      {selectedGroup && pinnedMessages.length > 0 && (
        <div className="border-b border-blue-500/20 p-2 bg-blue-900/10">
          <div className="text-sm text-blue-400 mb-2 flex items-center gap-2">
            <Pin size={14} />
            <span>Pinned Messages ({pinnedMessages.length})</span>
          </div>
          <div
            className={`space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 
            scrollbar-track-transparent pr-2 ${
              pinnedMessages.length > 2 ? "max-h-[120px]" : ""
            }`}
          >
            {pinnedMessages.map((msg) => (
              <div
                key={msg._id}
                className="flex items-start gap-2 text-sm text-gray-300 p-2 rounded 
                bg-blue-900/20 hover:bg-blue-900/30 transition-colors cursor-pointer"
                onClick={() => scrollToMessage(msg._id)}
              >
                <img
                  src={msg.sender.avatar || "/avatar.png"}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{msg.sender.username}</div>
                  {msg.type === "poll" && msg.poll ? (
                    <div className="flex items-center gap-2 mt-1">
                      <BarChart2 size={16} className="text-blue-300" />
                      <span className="truncate text-blue-300">
                        Poll: {msg.poll.question}
                      </span>
                    </div>
                  ) : msg.mediaUrl ? (
                    <div
                      onClick={() => window.open(msg.mediaUrl, "_blank")}
                      className="flex items-center gap-2 mt-1 cursor-pointer hover:bg-blue-900/40 p-1 rounded transition-colors"
                    >
                      {msg.mediaUrl.includes("/image/") ? (
                        <>
                          <img
                            src={msg.mediaUrl}
                            alt="Pinned media"
                            className="w-8 h-8 object-cover rounded"
                          />
                          <span className="truncate text-blue-300">
                            Pinned Image
                          </span>
                        </>
                      ) : (
                        <>
                          <FileText size={16} className="text-blue-300" />
                          <span className="truncate text-blue-300">
                            Pinned Document
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div>{msg.content}</div>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleUnpin(msg._id)}
                    className="ml-auto text-red-400 hover:text-red-300"
                  >
                    <Pin size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin 
          scrollbar-thumb-blue-600 scrollbar-track-transparent 
          scroll-smooth will-change-scroll overscroll-y-contain"
      >
        {/* Group messages by date */}
        {sortedDates.map((date) => {
          const displayDate =
            date === new Date().toLocaleDateString() ? "Today" : date;
          return (
            <div key={date}>
              <div className="text-center my-4">
                <span className="px-4 py-1 bg-blue-700 text-xs rounded-full">
                  {displayDate}
                </span>
              </div>
              {groupedMessages[date].map((message, index) => (
                <div
                  key={`${message._id}-${index}`}
                  className="relative"
                  ref={(el) => (messageRefs.current[message._id] = el)}
                >
                  <div
                    className={`flex items-start gap-2 animate-fade-in ${
                      message.sender?._id === authUser._id
                        ? "flex-row-reverse"
                        : "flex-row"
                    }`}
                    ref={
                      index === groupedMessages[date].length - 1 &&
                      date === sortedDates[sortedDates.length - 1]
                        ? messageEndRef
                        : null
                    }
                  >
                    <div className="flex-shrink-0">
                      <div className="size-10 rounded-full overflow-hidden border-2 border-blue-500/30 shadow-lg shadow-blue-500/20">
                        <img
                          src={
                            message.sender?._id === authUser._id
                              ? authUser.avatar || "/avatar.png"
                              : message.sender?.avatar || "/avatar.png"
                          }
                          alt="profile pic"
                          className="w-full h-full object-cover"
                        />
                        {/* Optionally show username below the avatar for group messages */}
                        {message.sender?._id !== authUser._id && (
                          <span className="text-xs text-gray-300 text-center block">
                            {message.sender.username}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      // Call handler directly; the function itself checks if the current user is the sender
                      onClick={() => handleMessageClick(message)}
                      className="relative cursor-pointer group max-w-[70%]"
                    >
                      {message.sender?._id !== authUser._id && (
                        <div className="mb-1 text-xs text-gray-300">
                          {message.sender.username}
                        </div>
                      )}
                      <div className="relative">
                        {message.type === "poll" && message.poll ? (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActionsFor(
                                  showActionsFor === message._id
                                    ? null
                                    : message._id
                                );
                              }}
                              className="absolute -top-2 -right-2 p-1.5 text-gray-200 
                        hover:text-white bg-gray-700 hover:bg-gray-600 
                        rounded-full opacity-0 group-hover:opacity-100 
                        transition-opacity duration-200 z-10"
                            >
                              <ChevronDown size={14} />
                            </button>

                            {showActionsFor === message._id && (
                              <div
                                className="absolute -top-2 -right-2 mt-8 bg-gray-700 
                        rounded-md shadow-lg py-1 z-20 min-w-[120px] border border-gray-600"
                              >
                                {isAdmin &&
                                  !pinnedMessages.some(
                                    (pin) => pin._id === message._id
                                  ) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePin(message._id);
                                      }}
                                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-200 
                                hover:bg-gray-600 w-full transition-colors duration-150"
                                    >
                                      <Pin size={14} />
                                      Pin Message
                                    </button>
                                  )}
                                {message.sender?._id === authUser._id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMessage(message._id);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 
                              hover:bg-gray-600 w-full transition-colors duration-150"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                            <PollMessage
                              poll={message.poll}
                              authUser={authUser}
                            />
                          </div>
                        ) : (
                          <div
                            className={`relative rounded-lg px-4 py-2 shadow-lg group ${
                              message.sender?._id === authUser._id
                                ? "bg-blue-600 text-white rounded-tr-none"
                                : "bg-gray-400 text-black rounded-tl-none"
                            }`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActionsFor(
                                  showActionsFor === message._id
                                    ? null
                                    : message._id
                                );
                              }}
                              className="absolute -top-2 -right-2 p-1.5 text-gray-200 
                        hover:text-white bg-gray-700 hover:bg-gray-600 
                        rounded-full opacity-0 group-hover:opacity-100 
                        transition-opacity duration-200 z-10"
                            >
                              <ChevronDown size={14} />
                            </button>

                            {showActionsFor === message._id && (
                              <div
                                className="absolute -top-2 -right-2 mt-8 bg-gray-700 
                        rounded-md shadow-lg py-1 z-20 min-w-[120px] border border-gray-600"
                              >
                                {isAdmin &&
                                  !pinnedMessages.some(
                                    (pin) => pin._id === message._id
                                  ) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePin(message._id);
                                      }}
                                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-200 
                                hover:bg-gray-600 w-full transition-colors duration-150"
                                    >
                                      <Pin size={14} />
                                      Pin Message
                                    </button>
                                  )}
                                {message.sender?._id === authUser._id && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMessage(message._id);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 
                              hover:bg-gray-600 w-full transition-colors duration-150"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Message content */}
                            {message.mediaUrl && (
                              <div className="mb-2">
                                {message.mediaUrl.includes("/image/") ? (
                                  <img
                                    src={message.mediaUrl}
                                    alt="Media"
                                    className="max-w-[200px] rounded-md hover:scale-105 transition-transform cursor-pointer"
                                    onClick={() =>
                                      window.open(message.mediaUrl, "_blank")
                                    }
                                  />
                                ) : (
                                  <div
                                    className="flex items-center gap-2 p-2 bg-blue-900/30 rounded-md cursor-pointer hover:bg-blue-900/50"
                                    onClick={() =>
                                      window.open(message.mediaUrl, "_blank")
                                    }
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
                        )}
                        <time className="text-xs text-gray-400 mt-1 px-2">
                          {formatMessageTime(message.createdAt)}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <MessageInput selectedUser={selectedUser} selectedGroup={selectedGroup} />
    </div>
  );
};
export default ChatContainer;
