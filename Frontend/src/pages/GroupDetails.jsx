import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getGroupDetails,
  addMemberToGroup,
  removeMemberFromGroup,
  deleteGroup,
  promoteMember,
  leaveGroup,
  editGroupDetails,
  updateGroupAvatar,
  joinGroup,
} from "../utils/groupService";
import { searchUsers } from "../utils/profileService";
import { toast } from "react-hot-toast";

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groupDetails, setGroupDetails] = useState(null);
  const [newMemberQuery, setNewMemberQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editedGroupDetails, setEditedGroupDetails] = useState({});
  const [newTag, setNewTag] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const data = await getGroupDetails(groupId);
        setGroupDetails(data);
      } catch (error) {
        console.error("Error fetching group details:", error);
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const handleSearchUsers = async () => {
    try {
      const results = await searchUsers(newMemberQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handleAddMember = async () => {
    try {
      await addMemberToGroup(groupId, selectedMemberId);
      setNewMemberQuery("");
      setSearchResults([]);
      setSelectedMemberId("");
      toast.success("Member added successfully!");
      // Refresh group details after adding member
      const data = await getGroupDetails(groupId);
      setGroupDetails(data);
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await removeMemberFromGroup(groupId, memberId);
      toast.success("Member removed successfully!");
      // Refresh group details after removing member
      const data = await getGroupDetails(groupId);
      setGroupDetails(data);
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const handlePromoteMember = async (memberId) => {
    try {
      await promoteMember(groupId, memberId);
      toast.success("Member promoted to admin successfully!");
      // Refresh group details after promoting member
      const data = await getGroupDetails(groupId);
      setGroupDetails(data);
    } catch (error) {
      console.error("Error promoting member:", error);
      toast.error("Failed to promote member");
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(groupId);
      toast.success("Group deleted successfully!");
      navigate("/groups");
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Failed to delete group");
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(groupId);
      toast.success("Left group successfully!");
      navigate("/groups");
    } catch (error) {
      console.error("Error leaving group:", error);
      toast.error("Failed to leave group");
    }
  };

  const handleJoinGroup = async () => {
    try {
      await joinGroup(groupId);
      toast.success("Successfully joined group!");
      // Refresh group details
      const data = await getGroupDetails(groupId);
      setGroupDetails(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error joining group");
    }
  };

  const handleEditGroupDetails = async () => {
    try {
      // Handle avatar update if file is selected
      if (editedGroupDetails.avatar) {
        await updateGroupAvatar(groupId, editedGroupDetails.avatar);
      }

      // Handle other updates
      const updates = {
        name: editedGroupDetails.name,
        description: editedGroupDetails.description,
        isPublic: editedGroupDetails.isPublic,
        tags: editedGroupDetails.tags?.join(","),
      };

      const { group } = await editGroupDetails(groupId, updates);
      setGroupDetails(group);
      toast.success("Group details updated successfully!");
      setEditMode(false);
      setEditedGroupDetails({});
    } catch (error) {
      console.error("Error updating group details:", error);
      toast.error(
        error.response?.data?.message || "Failed to update group details"
      );
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() !== "") {
      setEditedGroupDetails({
        ...editedGroupDetails,
        tags: editedGroupDetails.tags
          ? [...editedGroupDetails.tags, newTag]
          : [...groupDetails.tags, newTag],
      });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditedGroupDetails({
      ...editedGroupDetails,
      tags: (editedGroupDetails.tags || groupDetails.tags).filter(
        (tag) => tag !== tagToRemove
      ),
    });
  };

  if (!groupDetails) {
    return <div>Loading...</div>;
  }

  const isAdmin = groupDetails.admins.some(
    (admin) => admin._id === currentUser._id
  );

  const isMember = groupDetails?.members.some(
    (member) => member._id === currentUser._id
  );

  return (
    <div className="min-h-screen bg-[#010038] flex flex-col">
      <div className="min-w-6xl mx-auto mt-10 p-8 bg-[#474F7A] text-white shadow-2xl rounded-lg">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="max-w-lg mx-auto bg-[#1E2A63] p-6 rounded-xl shadow-lg text-white flex-1 relative">
            {editMode ? (
              <>
                <label className="block text-sm font-medium text-white mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={
                    editedGroupDetails.name !== undefined
                      ? editedGroupDetails.name
                      : groupDetails.name
                  }
                  onChange={(e) =>
                    setEditedGroupDetails({
                      ...editedGroupDetails,
                      name: e.target.value,
                    })
                  }
                  className="border p-2 mb-2 text-black rounded-lg w-full"
                />
                <label className="block text-sm font-medium text-white mb-1">
                  Description
                </label>
                <textarea
                  value={
                    editedGroupDetails.description !== undefined
                      ? editedGroupDetails.description
                      : groupDetails.description
                  }
                  onChange={(e) =>
                    setEditedGroupDetails({
                      ...editedGroupDetails,
                      description: e.target.value,
                    })
                  }
                  className="border p-2 mb-2 text-black rounded-lg w-full"
                />
                <label className="block text-sm font-medium text-white mb-1">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="border p-2 text-black rounded-lg w-full"
                  />
                  <button
                    onClick={handleAddTag}
                    className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition duration-300"
                  >
                    Add Tag
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(editedGroupDetails.tags || groupDetails.tags).map(
                    (tag, index) => (
                      <span
                        key={index}
                        className="bg-[#293A80] text-white border border-[#537EC5] px-3 py-1 rounded-lg text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-500 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    )
                  )}
                </div>
                <label className="block text-sm font-medium text-white mb-1">
                  Avatar
                </label>
                <input
                  name="avatar" // <-- Added name attribute to match backend expectation
                  type="file"
                  onChange={(e) =>
                    setEditedGroupDetails({
                      ...editedGroupDetails,
                      avatar: e.target.files[0],
                    })
                  }
                  className="border p-2 mb-2 text-black rounded-lg w-full"
                />
                <button
                  onClick={handleEditGroupDetails}
                  className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition duration-300"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="bg-red-500 text-white p-2 mt-2 rounded-lg hover:bg-red-600 transition duration-300"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <img
                  src={groupDetails.avatar || "https://via.placeholder.com/150"}
                  alt="Group Avatar"
                  className="w-32 h-32 rounded-full mx-auto mb-4"
                />
                <h1 className="text-3xl font-bold mb-4">{groupDetails.name}</h1>
                <p className="mt-2 text-lg">{groupDetails.description}</p>
                <p className="mt-2 text-lg">
                  <strong>College Name:</strong> {groupDetails.collegename}
                </p>
                <p className="mt-2 text-lg">
                  <strong>Created At:</strong>{" "}
                  {new Date(groupDetails.createdAt).toLocaleString()}
                </p>
                <p className="mt-2 text-lg">
                  <strong>Tags:</strong>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {groupDetails.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-[#293A80] text-white border border-[#537EC5] px-3 py-1 rounded-lg text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </p>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditMode(true)}
                      className="bg-yellow-500 text-white p-2 mt-4 rounded-lg hover:bg-yellow-600 transition duration-300"
                    >
                      Edit Group
                    </button>
                    <button
                      onClick={handleDeleteGroup}
                      className="bg-red-500 text-white p-2 mt-4 rounded-lg hover:bg-red-600 transition duration-300"
                    >
                      Delete Group
                    </button>
                  </div>
                )}
                {!isAdmin && !isMember && (
                  <button
                    onClick={handleJoinGroup}
                    className="bg-blue-500 text-white p-2 mt-4 rounded-lg hover:bg-blue-600 transition duration-300"
                  >
                    Join Group
                  </button>
                )}
                {!isAdmin && isMember && (
                  <button
                    onClick={handleLeaveGroup}
                    className="bg-red-500 text-white p-2 mt-4 rounded-lg hover:bg-red-600 transition duration-300"
                  >
                    Leave Group
                  </button>
                )}
              </>
            )}
          </div>
          <div className="max-w-lg mx-auto bg-[#1E2A63] p-6 rounded-xl shadow-lg text-white flex-1 relative">
            <h2 className="text-2xl font-semibold mb-4">Members</h2>
            <ul className="mt-2">
              {groupDetails.admins.map((admin) => (
                <li key={admin._id} className="flex items-center gap-2 mb-2">
                  <img
                    src={admin.avatar || "https://via.placeholder.com/50"}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border-2 border-[#537EC5] shadow-md"
                  />
                  {admin.username}{" "}
                  <span className="text-sm text-gray-400">(Admin)</span>
                </li>
              ))}
              {groupDetails.members
                .filter(
                  (member) =>
                    !groupDetails.admins.some(
                      (admin) => admin._id === member._id
                    )
                )
                .map((member) => (
                  <li key={member._id} className="flex items-center gap-2 mb-2">
                    <img
                      src={member.avatar || "https://via.placeholder.com/50"}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full border-2 border-[#537EC5] shadow-md"
                    />
                    {member.username}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="bg-red-500 text-white text-sm p-1 ml-2 rounded-lg hover:bg-red-600 transition duration-300"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => handlePromoteMember(member._id)}
                          className="bg-green-500 text-white text-sm  p-1 ml-2 rounded-lg hover:bg-green-600 transition duration-300"
                        >
                          Admin
                        </button>
                      </>
                    )}
                  </li>
                ))}
            </ul>
            {isAdmin && (
              <div className="mt-4">
                <input
                  type="text"
                  value={newMemberQuery}
                  onChange={(e) => setNewMemberQuery(e.target.value)}
                  placeholder="Search user by name"
                  className="border p-2 mr-2 text-black rounded-lg"
                />
                <button
                  onClick={handleSearchUsers}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition duration-300"
                >
                  Search
                </button>
                {searchResults.length > 0 && (
                  <ul className="mt-2">
                    {searchResults.map((user) => (
                      <li
                        key={user._id}
                        onClick={() => setSelectedMemberId(user._id)}
                        className={`cursor-pointer p-2 flex items-center gap-2 mb-2 rounded-lg ${
                          selectedMemberId === user._id ? "bg-blue-500" : ""
                        }`}
                      >
                        <img
                          src={user.avatar || "https://via.placeholder.com/50"}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full border-2 border-[#537EC5] shadow-md"
                        />
                        <div>
                          <p>{user.username}</p>
                          <div className="flex flex-wrap gap-1">
                            {user.interests?.map((interest, index) => (
                              <span
                                key={index}
                                className="bg-[#293A80] text-white border border-[#537EC5] px-2 py-1 rounded-lg text-xs"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={handleAddMember}
                  className="bg-green-500 text-white p-2 mt-2 rounded-lg hover:bg-green-600 transition duration-300"
                  disabled={!selectedMemberId}
                >
                  Add Member
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
