import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getUserProfile,
  sendFriendRequest,
  removeFriend,
} from "../../utils/profileService";
import { toast } from "react-hot-toast";

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserProfile(userId);
        console.log(response);
        setUser(response);
        const currentUser = JSON.parse(localStorage.getItem("user"));
        const currentUserId = currentUser._id;
        setIsFriend(
          response.friends.some((friend) => friend._id === currentUserId)
        );
        setRequestSent(response.receivedRequests.includes(currentUserId));
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };
    fetchUser();
  }, [userId]);

  const handleSendRequest = async () => {
    try {
      if (isFriend) {
        toast.success("Already a Friend!");
        return;
      }
      await sendFriendRequest(userId);
      toast.success("Friend request sent successfully!");
      setRequestSent(true);
    } catch (error) {
      toast.error(error.message || "Failed to send friend request");
    }
  };

  const handleRemoveFriend = async () => {
    try {
      await removeFriend(userId);
      toast.success("Friend removed successfully!");
      setIsFriend(false);
    } catch (error) {
      toast.error(error.message || "Failed to remove friend");
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#010038] flex flex-col">
      <div className="min-w-6xl mx-auto mt-10 p-8 bg-[#474F7A] text-white shadow-2xl rounded-lg">
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
                <strong>College:</strong> {user.collegename || "Not specified"}
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

            {/* Friend Request Button */}
            <div className="text-center mt-6 flex justify-center">
              {isFriend ? (
                <button
                  onClick={handleRemoveFriend}
                  className="btn bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-all flex items-center gap-2"
                >
                  Remove Friend
                </button>
              ) : (
                <button
                  onClick={handleSendRequest}
                  className="btn bg-[#5755FE] text-white px-4 py-2 rounded-lg hover:bg-[#4341D1] transition-all flex items-center gap-2"
                  disabled={requestSent}
                >
                  {requestSent ? "Request Sent" : "Send Friend Request"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
