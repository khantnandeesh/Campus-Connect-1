import { X } from "lucide-react";

const ChatHeader = ({ selectedUser, setSelectedUser, onlineUsers }) => {
  return (
    <div className="p-2.5 border-b border-base-300 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 avatar">
            <div className="size-10 rounded-full overflow-hidden border-2 border-blue-500/30 shadow-lg shadow-blue-500/20">
              <img
                src={selectedUser.avatar || "/avatar.png"}
                alt={selectedUser.username}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.username}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
