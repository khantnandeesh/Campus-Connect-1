import { useEffect, useState, useMemo } from "react";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, Plus } from "lucide-react";
import { getUserFriends, socket } from "../../utils/personalChatService"; // Import function and socket
import {
  createGroup,
  getUserGroups,
  searchPublicGroups,
} from "../../utils/groupService"; // Import group service functions
import { searchUsers } from "../../utils/profileService"; // Import profile service function

const Sidebar = ({
  selectedUser,
  setSelectedUser,
  selectedGroup,
  setSelectedGroup,
  onlineUsers,
  setOnlineUsers,
}) => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for dialog box
  const [groupData, setGroupData] = useState({
    name: "",
    description: "",
    tags: [],
    isPublic: true,
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [tagInput, setTagInput] = useState(""); // State for tag input

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

  // Extracted fetch function for user groups
  const fetchUserGroups = async () => {
    const userGroups = await getUserGroups();
    setGroups(userGroups);
  };

  useEffect(() => {
    fetchUserFriends();
    fetchUserGroups();
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

  const filteredGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      ),
    [groups, searchTerm]
  );

  const handleCreateGroup = async () => {
    try {
      const newGroup = await createGroup({
        ...groupData,
        members: selectedMembers.map((member) => member._id),
      });
      setIsDialogOpen(false);
      fetchUserFriends(); // Refresh user friends list
      fetchUserGroups(); // Refresh user groups list
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleSearchUsers = async (query) => {
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handleAddTag = () => {
    if (tagInput && !groupData.tags.includes(tagInput)) {
      setGroupData({ ...groupData, tags: [...groupData.tags, tagInput] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setGroupData({
      ...groupData,
      tags: groupData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleAddMember = (user) => {
    if (!selectedMembers.some((member) => member._id === user._id)) {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const handleRemoveMember = (userId) => {
    setSelectedMembers(
      selectedMembers.filter((member) => member._id !== userId)
    );
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-blue-800/30 flex flex-col transition-all duration-200 bg-[#1e293b]">
      <div className="border-b border-blue-800/30 w-full p-5 flex items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search friends or groups..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#0f172a] text-gray-100 border-blue-500/30 focus:border-blue-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="ml-3 p-2 bg-blue-600 text-white rounded-lg"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus />
        </button>
      </div>
      <div className="overflow-y-auto w-full py-3 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-transparent">
        <div className="text-white px-3 py-2">Friends</div>
        {filteredUsers.map(({ friend, recentMessages, isOnline, chatId }) => (
          <button
            key={friend._id}
            onClick={() => {
              setSelectedUser({ ...friend, chatId });
              setSelectedGroup(null); // Deselect group
            }}
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
        <div className="text-white px-3 py-2">Groups</div>
        {filteredGroups.map((group) => (
          <button
            key={group._id}
            onClick={() => {
              setSelectedGroup(group);
              setSelectedUser(null); // Deselect user
            }}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-blue-800/20 transition-all duration-200
              ${selectedGroup?._id === group._id ? "bg-blue-800/30" : ""}
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <div className="size-12 object-cover rounded-full bg-blue-600 flex items-center justify-center text-white">
                <img
                  src={group.avatar || "/avatar.png"}
                  alt={group.name}
                  className={`size-12 object-cover rounded-full `}
                />
              </div>
            </div>
            <div className="hidden lg:block text-left min-w-0 text-white">
              <div className="font-medium truncate">{group.name}</div>
              <div className="text-xs text-zinc-500">
                {group.description || "No description"}
              </div>
            </div>
          </button>
        ))}
        {filteredGroups.length === 0 && (
          <div className="text-center text-blue-400 py-4">No groups found</div>
        )}
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create New Group</h2>
            <input
              type="text"
              placeholder="Group Name"
              className="w-full mb-2 p-2 border rounded"
              value={groupData.name}
              onChange={(e) =>
                setGroupData({ ...groupData, name: e.target.value })
              }
            />
            <textarea
              placeholder="Description"
              className="w-full mb-2 p-2 border rounded"
              value={groupData.description}
              onChange={(e) =>
                setGroupData({ ...groupData, description: e.target.value })
              }
            />
            <div className="mb-2">
              <input
                type="text"
                placeholder="Add tags"
                className="w-full p-2 border rounded"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <div className="flex flex-wrap mt-2">
                {groupData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-blue-600 text-white rounded-full px-3 py-1 mr-2 mb-2 flex items-center"
                  >
                    {tag}
                    <button
                      className="ml-2 text-white"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={groupData.isPublic}
                onChange={(e) =>
                  setGroupData({ ...groupData, isPublic: e.target.checked })
                }
              />
              <label className="ml-2">Public Group</label>
            </div>
            <input
              type="text"
              placeholder="Search users to add"
              className="w-full mb-2 p-2 border rounded"
              onChange={(e) => handleSearchUsers(e.target.value)}
            />
            <div className="max-h-32 overflow-y-auto mb-2">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2 border-b"
                >
                  <span>{user.username}</span>
                  <button
                    className="p-1 bg-blue-600 text-white rounded"
                    onClick={() => handleAddMember(user)}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap mt-2">
              {selectedMembers.map((member) => (
                <div
                  key={member._id}
                  className="bg-blue-600 text-white rounded-full px-3 py-1 mr-2 mb-2 flex items-center"
                >
                  {member.username}
                  <button
                    className="ml-2 text-white"
                    onClick={() => handleRemoveMember(member._id)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                className="mr-2 p-2 bg-gray-300 rounded"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="p-2 bg-blue-600 text-white rounded"
                onClick={handleCreateGroup}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;
