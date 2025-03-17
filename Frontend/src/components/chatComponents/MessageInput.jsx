import { useRef, useState, useEffect, useCallback } from "react";
import { Image, Send, X, FileText, PlusCircle, BarChart2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  sendMessage,
  sendImage,
  sendDocument,
  createChat,
  socket as personalSocket,
} from "../../utils/personalChatService";
import {
  sendGroupMessage,
  sendGroupImage,
  sendGroupDocument,
  createPoll,
  socket as groupSocket,
} from "../../utils/groupService";

const MessageInput = ({ selectedUser, selectedGroup }) => {
  const authUser = JSON.parse(localStorage.getItem("user"));

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState("1"); // in days

  // Debounce typing status
  useEffect(() => {
    const currentSocket = selectedGroup ? groupSocket : personalSocket;
    if (text && (selectedUser?.chatId || selectedGroup?._id)) {
      const chatId = selectedUser?.chatId || selectedGroup?._id;
      currentSocket.emit("typing", {
        chatId,
        userId: authUser._id,
      });
      const timeout = setTimeout(() => {
        currentSocket.emit("stopTyping", {
          chatId,
          userId: authUser._id,
        });
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [text, selectedUser?.chatId, selectedGroup?._id]);

  const clearFileInputs = useCallback(() => {
    setImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    toast.success(`Document selected: ${file.name}`);
  };

  const removeFile = useCallback(() => {
    clearFileInputs();
  }, [clearFileInputs]);

  const handleImageUpload = async (imageFile, messageText) => {
    const formData = new FormData();
    formData.append("file", imageFile); // ensure key is "file"
    formData.append("content", messageText || "");
    try {
      const response = await sendGroupImage(selectedGroup._id, formData);
      // ...existing success handling...
    } catch (error) {
      toast.error("Failed to send image");
    }
  };

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      // Ensure at least text or a file is provided, and prevent duplicate sends
      if ((!text.trim() && !selectedFile) || isUploading) return;

      try {
        setIsUploading(true);
        if (selectedUser && !selectedUser.chatId) {
          const chat = await createChat(selectedUser._id);
          selectedUser.chatId = chat._id;
        }
        const chatId = selectedUser?.chatId || selectedGroup?._id;

        // When a file is selected, always send file with the provided text (can be empty)
        if (selectedFile) {
          if (selectedFile.type.startsWith("image/")) {
            if (selectedUser) {
              await sendImage(chatId, selectedFile, text.trim());
            } else {
              await handleImageUpload(selectedFile, text.trim());
            }
          } else {
            if (selectedUser) {
              await sendDocument(chatId, selectedFile, text.trim());
            } else {
              await sendGroupDocument(chatId, selectedFile, text.trim());
            }
          }
        } else if (text.trim()) {
          if (selectedUser) {
            await sendMessage(chatId, text.trim());
          } else {
            await sendGroupMessage(chatId, { content: text.trim() }); // Ensure this event is emitted
          }
        }

        // Clear form
        setText("");
        clearFileInputs();
      } catch (error) {
        console.error("Failed to send message:", error);
        toast.error("Failed to send message");
      } finally {
        setIsUploading(false);
      }
    },
    [
      text,
      selectedFile,
      selectedUser,
      selectedGroup,
      isUploading,
      clearFileInputs,
    ]
  );

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    try {
      const pollData = {
        question: pollQuestion,
        options: pollOptions.filter((opt) => opt.trim()),
        duration: parseInt(pollDuration),
      };

      await createPoll(selectedGroup._id, pollData);
      setShowPollCreator(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setPollDuration("1");
    } catch (error) {
      toast.error("Failed to create poll");
    }
  };

  return (
    <div className="p-4 w-full bg-[#1e293b] border-t border-blue-800/30">
      {/* File preview section */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-blue-500/30"
            />
            <button
              onClick={removeFile}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-800/50
              flex items-center justify-center text-blue-200 hover:bg-blue-700/50"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}
      {selectedFile && !imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <div className="w-20 h-20 flex items-center justify-center bg-blue-800/30 rounded-lg border border-blue-500/30">
              <FileText size={32} className="text-blue-400" />
              <div className="text-xs text-blue-400 mt-1">
                {selectedFile.name}
              </div>
            </div>
            <button
              onClick={removeFile}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-800/50
              flex items-center justify-center text-blue-200 hover:bg-blue-700/50"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {showPollCreator ? (
        <form onSubmit={handleCreatePoll} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Create Poll</h3>
            <button
              type="button"
              onClick={() => setShowPollCreator(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <input
            type="text"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />

          <div className="space-y-2">
            {pollOptions.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...pollOptions];
                    newOptions[index] = e.target.value;
                    setPollOptions(newOptions);
                  }}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 p-2 rounded bg-gray-700 text-white"
                  required
                />
                {index > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPollOptions(pollOptions.filter((_, i) => i !== index))
                    }
                    className="text-red-400 hover:text-red-300"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={() => setPollOptions([...pollOptions, ""])}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <PlusCircle size={20} />
                Add Option
              </button>
            )}
          </div>

          <select
            value={pollDuration}
            onChange={(e) => setPollDuration(e.target.value)}
            className="p-2 rounded bg-gray-700 text-white"
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">1 week</option>
          </select>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Create Poll
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleSendMessage}
          className="flex items-center justify-center gap-2"
        >
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              className="w-full min-h-8 bg-[#0f172a] text-gray-100 border-blue-500/30 focus:border-blue-400 
                input input-bordered rounded-lg input-sm sm:input-md placeholder-gray-500 p-2"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <input
              type="file"
              name="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <input
              type="file"
              name="file"
              className="hidden"
              ref={documentInputRef}
              onChange={handleDocumentChange}
            />
          </div>

          <button
            type="button"
            className="hidden sm:flex btn btn-circle border-blue-500/30 hover:bg-blue-800/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={22} className="text-blue-400" />
          </button>

          <button
            type="button"
            className="hidden sm:flex btn btn-circle border-blue-500/30 hover:bg-blue-800/50"
            onClick={() => documentInputRef.current?.click()}
          >
            <FileText size={22} className="text-blue-400" />
          </button>

          {selectedGroup && (
            <button
              type="button"
              onClick={() => setShowPollCreator(true)}
              className="p-2 text-blue-400 hover:text-blue-300"
              title="Create Poll"
            >
              <BarChart2 size={20} />
            </button>
          )}

          <button
            type="submit"
            className="btn btn-sm btn-circle hover:bg-blue-700 border-none text-white"
            disabled={(!text.trim() && !selectedFile) || isUploading}
          >
            {isUploading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Send size={22} />
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default MessageInput;
