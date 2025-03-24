import { useEffect, useState } from "react";
import {
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
} from "../utils/profileService";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast"; // Import toast for error handling
import { FaEdit, FaSave, FaTimes, FaPlus, FaUserFriends } from "react-icons/fa"; // Import icons

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    interest: [],
    gender: "",
    age: "",
  });
  const [newInterest, setNewInterest] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserProfile(userId);
        setUser(data);
        console.log(data);
        const loggedInUser = JSON.parse(localStorage.getItem("user"));
        console.log("Logged in user:", loggedInUser); // Debug log
        setIsOwnProfile(loggedInUser?.id === userId);
        setFormData({
          username: data.username || "",
          bio: data.bio || "",
          interest: data.interest || [],
          gender: data.gender || "",
          age: data.age || "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile"); // Add error toast
        navigate("/dashboard"); // Redirect to dashboard instead of home
      }
    };

    if (userId) {
      // Only fetch if userId exists
      fetchUser();
    } else {
      console.error("No userId provided");
      navigate("/dashboard");
    }
  }, [userId, navigate]);

  const handleAvatarChange = (e) => {
    setAvatarFile(e.target.files[0]);
  };

  const handleUpdate = async () => {
    try {
      if (avatarFile) {
        await updateUserAvatar(userId, avatarFile);
      }
      await updateUserProfile(userId, formData);
      setUser({ ...user, ...formData });
      setEditMode(false);
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update profile"); // Add error toast
    }
  };

  const handleAddInterest = () => {
    if (newInterest && !formData.interest.includes(newInterest)) {
      setFormData({
        ...formData,
        interest: [...formData.interest, newInterest],
      });
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setFormData({
      ...formData,
      interest: formData.interest.filter(
        (interest) => interest !== interestToRemove
      ),
    });
  };

  if (!user) return <p className="text-center">Loading...</p>;

  return (
    <div className="min-h-screen bg-[#010038] flex flex-col">
      <div className="min-w-6xl mx-auto mt-10 p-8 bg-[#474F7A] text-white shadow-2xl rounded-lg">
        <h2 className="text-2xl font-bold text-center mb-4">Profile</h2>
        {editMode ? (
          <div className="max-w-lg mx-auto bg-[#1E2A63] p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              Edit Profile
            </h2>

            <div className="flex flex-col gap-3">
              {/* Avatar */}
              <label className="text-white">Avatar</label>
              <input
                type="file"
                className="input input-bordered w-full rounded-lg p-2 border-[#537EC5] bg-[#293A80] text-white focus:outline-none focus:ring-2 focus:ring-[#537EC5]"
                onChange={handleAvatarChange}
              />

              {/* Username */}
              <label className="text-white">Username</label>
              <input
                type="text"
                className="input input-bordered w-full rounded-lg p-2 border-[#537EC5] bg-[#293A80] text-white focus:outline-none focus:ring-2 focus:ring-[#537EC5]"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />

              {/* Bio */}
              <label className="text-white">Bio</label>
              <textarea
                className="textarea textarea-bordered w-full rounded-lg p-2 border-[#537EC5] bg-[#293A80] text-white focus:outline-none focus:ring-2 focus:ring-[#537EC5]"
                value={formData.bio}
                placeholder="Write something about yourself..."
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />

              {/* Interests */}
              <label className="text-white">Interests</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="input input-bordered w-full rounded-lg p-2 border-[#537EC5] bg-[#293A80] text-white focus:outline-none focus:ring-2 focus:ring-[#537EC5]"
                  value={newInterest}
                  placeholder="Add Interest"
                  onChange={(e) => setNewInterest(e.target.value)}
                />
                <button
                  onClick={handleAddInterest}
                  className="btn bg-[#5755FE] text-white px-3 py-2 rounded-lg hover:bg-[#4341D1] transition-all flex items-center gap-2"
                >
                  <FaPlus /> Add
                </button>
              </div>

              {/* Interest Tags */}
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.interest.map((interest, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-[#293A80] text-white border border-[#537EC5] px-3 py-1 rounded-lg"
                  >
                    {interest}
                    <button
                      onClick={() => handleRemoveInterest(interest)}
                      className="text-white hover:text-red-400"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>

              {/* Gender */}
              <label className="text-white">Gender</label>
              <select
                className="select select-bordered w-full rounded-lg p-2 border-[#537EC5] bg-[#293A80] text-white focus:outline-none focus:ring-2 focus:ring-[#537EC5]"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>

              {/* Age */}
              <label className="text-white">Age</label>
              <input
                type="number"
                className="input input-bordered w-full rounded-lg p-2 border-[#537EC5] bg-[#293A80] text-white focus:outline-none focus:ring-2 focus:ring-[#537EC5]"
                value={formData.age}
                placeholder="Enter your age"
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
              />

              {/* Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleUpdate}
                  className="btn bg-[#5755FE] text-white px-4 py-2 rounded-lg hover:bg-[#4341D1] transition-all flex items-center gap-2"
                >
                  <FaSave /> Save Changes
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="btn bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-all flex items-center gap-2"
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="max-w-lg mx-auto bg-[#1E2A63] p-6 rounded-xl shadow-lg text-white flex-1 relative">
              {/* Profile Avatar */}
              <div className="flex flex-col items-center relative">
                <img
                  src={user.avatar || "https://via.placeholder.com/150"}
                  alt="Avatar"
                  className="w-28 h-28 rounded-full border-2 border-[#537EC5] shadow-md"
                />

                <h2 className="text-2xl font-semibold mt-3">{user.username}</h2>
                <p className="text-sm text-gray-300">{user.email}</p>
              </div>

              {/* Profile Details */}
              <div className="mt-6 space-y-3 text-center">
                <p>
                  <strong>College:</strong>{" "}
                  {user.collegename || "Not specified"}
                </p>
                <p>
                  <strong>Bio:</strong> {user.bio || "No bio added"}
                </p>

                {/* Interests */}
                <div>
                  <strong>Interests:</strong>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {user.interest?.length > 0 ? (
                      user.interest.map((interest, index) => (
                        <span
                          key={index}
                          className="bg-[#293A80] text-white border border-[#537EC5] px-3 py-1 rounded-lg text-sm"
                        >
                          {interest}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-300">No interests added</p>
                    )}
                  </div>
                </div>

                <p>
                  <strong>Gender:</strong> {user.gender || "Not specified"}
                </p>
                <p>
                  <strong>Age:</strong> {user.age || "Not specified"}
                </p>
              </div>

              {/* Edit Profile Button */}
              {!editMode && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn bg-[#5755FE] text-white px-4 py-2 rounded-lg hover:bg-[#4341D1] transition-all flex items-center gap-2"
                  >
                    <FaEdit /> Edit Profile
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1">
              {/* Friends Section */}
              <div className="bg-[#1E2A63] p-6 rounded-xl shadow-lg text-white mb-6">
                <h3 className="text-xl font-bold text-center mb-3">Friends</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {user.friends.length > 0 ? (
                    user.friends.map((friend) => (
                      <div
                        key={friend._id}
                        className="flex flex-col items-center"
                      >
                        <img
                          src={
                            friend.avatar || "https://via.placeholder.com/50"
                          }
                          alt="Friend Avatar"
                          className="w-12 h-12 rounded-full border-2 border-[#537EC5] shadow-sm"
                        />
                        <p className="text-sm">{friend.username}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-300">No friends added</p>
                  )}
                </div>
              </div>
              {/* Sent Requests Section */}
              <div className="bg-[#1E2A63] p-6 rounded-xl shadow-lg text-white">
                <h3 className="text-xl font-bold text-center mb-3">
                  Sent Requests
                </h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {user.sentRequests.length > 0 ? (
                    user.sentRequests.map((request) => (
                      <div
                        key={request._id}
                        className="flex flex-col items-center"
                      >
                        <img
                          src={
                            request.avatar || "https://via.placeholder.com/50"
                          }
                          alt="Request Avatar"
                          className="w-12 h-12 rounded-full border-2 border-[#537EC5] shadow-sm"
                        />
                        <p className="text-sm">{request.username}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-300">No sent requests</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
