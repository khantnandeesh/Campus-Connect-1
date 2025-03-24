import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UserSearch = ({ currentUserId }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Debounced search function
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `/api/users/search?query=${encodeURIComponent(searchQuery)}`
      );
      // Filter out the current user from results
      const filteredResults = response.data.filter(
        (user) => user._id !== currentUserId
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching users:", error);
      setError("Failed to search users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startChat = (userId) => {
    navigate(`/chat/${currentUserId}/${userId}`);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isLoading && (
            <div className="absolute right-3 top-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Start typing to search by name or email...
        </p>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
          {searchResults.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user.name
                    )}&background=random`
                  }
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
              <button
                onClick={() => startChat(user._id)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Chat
              </button>
            </div>
          ))}
        </div>
      )}

      {searchQuery && !isLoading && searchResults.length === 0 && (
        <div className="text-gray-500 text-center py-4">
          No users found matching your search.
        </div>
      )}
    </div>
  );
};

export default UserSearch;
