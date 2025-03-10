import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Get suggested users based on interest & college
export const getSuggestedUsers = async () => {
  try {
    const response = await apiClient.get("/users/suggestions");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch suggestions" };
  }
};

// Search users by username
export const searchUsers = async (query) => {
  try {
    const response = await apiClient.get(`/users/search?query=${query}`);
    console.log(response.data);

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Search failed" };
  }
};

// Get a specific user's profile
export const getUserProfile = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch user profile" };
  }
};

// Update user profile
export const updateUserProfile = async (userId, data) => {
  try {
    const response = await apiClient.put(`/users/${userId}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Profile update failed" };
  }
};

// Update user avatar
export const updateUserAvatar = async (userId, avatarFile) => {
  try {
    const formData = new FormData();
    formData.append("file", avatarFile);

    const response = await apiClient.put(`/users/avatar/${userId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to update avatar" };
  }
};

// Send friend request
export const sendFriendRequest = async (userId) => {
  try {
    const response = await apiClient.post(`/users/friend-request/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to send friend request" };
  }
};

// Accept friend request
export const acceptFriendRequest = async (userId) => {
  try {
    const response = await apiClient.post(`/users/accept-request/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to accept request" };
  }
};

// Reject friend request
export const rejectFriendRequest = async (userId) => {
  try {
    const response = await apiClient.post(`/users/reject-request/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to reject request" };
  }
};

// Get friend requests
export const getFriendRequests = async () => {
  try {
    const response = await apiClient.get("/users/friend-requests");
    return response.data;
  } catch (error) {
    throw (
      error.response?.data || { message: "Failed to fetch friend requests" }
    );
  }
};

// Remove friend
export const removeFriend = async (userId) => {
  try {
    const response = await apiClient.post(`/users/remove-friend/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to remove friend" };
  }
};
