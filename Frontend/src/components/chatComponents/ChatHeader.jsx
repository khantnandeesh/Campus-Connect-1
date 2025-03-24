import { X, Info } from "lucide-react"; // Import Info icon
import { useNavigate } from "react-router-dom"; // Import useNavigate

const ChatHeader = ({
  selectedUser,
  selectedGroup,
  setSelectedUser,
  setSelectedGroup,
  onlineUsers,
}) => {
  const isGroup = !!selectedGroup;
  const navigate = useNavigate(); // Initialize navigate

  const handleDetailsClick = () => {
    if (isGroup) {
      // Navigate to group details page
      navigate(`/groupDetails/${selectedGroup._id}`);
    } else {
      // Navigate to user profile page
      navigate(`/profile/${selectedUser._id}`);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 avatar">
            <div className="size-10 rounded-full overflow-hidden border-2 border-blue-500/30 shadow-lg shadow-blue-500/20">
              <img
                src={
                  isGroup
                    ? selectedGroup.avatar || "/avatar.png"
                    : selectedUser.avatar || "/avatar.png"
                }
                alt={isGroup ? selectedGroup.name : selectedUser.username}
              />
            </div>
          </div>

          {/* User/Group info */}
          <div>
            <h3 className="font-medium">
              {isGroup ? selectedGroup.name : selectedUser.username}
            </h3>
            {!isGroup && (
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {/* Details button */}
          <button onClick={handleDetailsClick} className="mr-2">
            <Info />
          </button>
          {/* Close button */}
          <button
            onClick={() => {
              if (isGroup) {
                setSelectedGroup(null);
              } else {
                setSelectedUser(null);
              }
            }}
          >
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
