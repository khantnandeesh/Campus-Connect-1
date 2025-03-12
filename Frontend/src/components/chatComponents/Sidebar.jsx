import { useEffect, useState, useMemo } from "react";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search } from "lucide-react";
import { getUserFriends, socket } from "../../utils/personalChatService"; // Import function and socket

const Sidebar = ({
  selectedUser,
  setSelectedUser,
  onlineUsers,
  setOnlineUsers,
}) => {
  const [users, setUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Extracted fetch function for user friends
  const fetchUserFriends = async () => {
    const friends = await getUserFriends();
    console.log("friends", friends);
    setUsers(friends);
    // Update online users based on friends who are online
    setOnlineUsers(
      friends
        .filter((friend) => friend.isOnline)
        .map((friend) => friend.friend._id)
    );
    setIsUsersLoading(false);
  };

  useEffect(() => {
    fetchUserFriends();
  }, [setOnlineUsers]);

  // Listen for message deletion to refresh recent message info
  useEffect(() => {
    socket.on("deleteMessage", () => {
      fetchUserFriends();
    });
    return () => socket.off("deleteMessage");
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter(({ friend }) =>
        friend.username.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [users, searchTerm]
  );

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-blue-800/30 flex flex-col transition-all duration-200 bg-[#1e293b]">
      <div className="border-b border-blue-800/30 w-full p-5">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search friends..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0f172a] text-gray-100 border-blue-500/30 focus:border-blue-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-y-auto w-full py-3 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent">
        {filteredUsers.map(({ friend, recentMessages, isOnline, chatId }) => (
          <button
            key={friend._id}
            onClick={() => setSelectedUser({ ...friend, chatId })}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-blue-800/20 transition-all duration-200
              ${selectedUser?._id === friend._id ? "bg-blue-800/30" : ""}
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={friend.avatar || "/avatar.png"}
                alt={friend.username}
                className={`size-12 object-cover rounded-full ${
                  isOnline ? "border-2 border-green-500" : ""
                }`}
              />
              {isOnline && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>
            <div className="hidden lg:block text-left min-w-0 text-white">
              <div className="font-medium truncate">{friend.username}</div>
              <div className="text-xs text-zinc-500">
                {recentMessages.length > 0
                  ? recentMessages[recentMessages.length - 1].content
                  : "No recent messages"}
              </div>
            </div>
          </button>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center text-blue-400 py-4">No users found</div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
