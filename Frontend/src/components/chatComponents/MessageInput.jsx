import { useRef, useState, useEffect, useCallback } from "react";
import { Image, Send, X, FileText } from "lucide-react";
import toast from "react-hot-toast";
import {
  sendMessage,
  sendImage,
  sendDocument,
  createChat,
  socket,
} from "../../utils/personalChatService";

const MessageInput = ({ selectedUser }) => {
  const authUser = JSON.parse(localStorage.getItem("user"));

  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Debounce typing status
  useEffect(() => {
    if (text && selectedUser?.chatId) {
      socket.emit("typing", {
        chatId: selectedUser.chatId,
        userId: authUser._id,
      });
      const timeout = setTimeout(() => {
        socket.emit("stopTyping", {
          chatId: selectedUser.chatId,
          userId: authUser._id,
        });
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [text, selectedUser?.chatId]);

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

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      // Ensure at least text or a file is provided, and prevent duplicate sends
      if ((!text.trim() && !selectedFile) || isUploading) return;

      try {
        setIsUploading(true);
        if (!selectedUser.chatId) {
          const chat = await createChat(selectedUser._id);
          selectedUser.chatId = chat._id;
        }
        // When a file is selected, always send file with the provided text (can be empty)
        if (selectedFile) {
          if (selectedFile.type.startsWith("image/")) {
            await sendImage(selectedUser.chatId, selectedFile, text.trim());
          } else {
            await sendDocument(selectedUser.chatId, selectedFile, text.trim());
          }
        } else if (text.trim()) {
          await sendMessage(selectedUser.chatId, text.trim());
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
    [text, selectedFile, selectedUser, isUploading, clearFileInputs]
  );

  return (
    <div className="p-4 w-full bg-[#1e293b] border-t border-blue-800/30 ">
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

      <form
        onSubmit={handleSendMessage}
        className="flex items-center justify-center gap-2"
      >
        <div className="flex-1 flex gap-2 ">
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
            name="file" // added name attribute so multer can extract the file
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <input
            type="file"
            name="file" // added name attribute so multer can extract the file
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
    </div>
  );
};
export default MessageInput;
