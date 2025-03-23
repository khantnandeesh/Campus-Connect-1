import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import {
  searchUsers,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
} from "../utils/profileService";
import SearchIcon from "@mui/icons-material/Search";
import AccountCircle from "@mui/icons-material/AccountCircle";
import MailIcon from "@mui/icons-material/Mail";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MoreIcon from "@mui/icons-material/MoreVert";
import axios from "axios";
import SearchResultItem from "./SearchResultItem"; // Import the new component
import { toast } from "react-hot-toast";
import { searchPublicGroups } from "../utils/groupService";

const socket = io("http://localhost:3000", { withCredentials: true });

const apiClient = axios.create({
  baseURL: "http://localhost:3000/",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

function useAuthStatus() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await apiClient.get("/auth/dashboard");

        if (response?.data?.user && !response?.data?.error) {
          setIsLoggedIn(true);
          setUser(response.data.user);
          // Store user data in localStorage
          localStorage.setItem("user", JSON.stringify(response.data.user));
        } else {
          setIsLoggedIn(false);
          setUser(null);
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Auth Error:", error);
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem("user");
      }
      setLoading(false);
    }

    // Try to get user from localStorage first
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }

    checkAuth();
  }, []);

  return { loading, isLoggedIn, user };
}

const Header = () => {
  const navigateTo = useNavigate();
  const { loading, isLoggedIn, user } = useAuthStatus();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("users"); // 'users' or 'groups'
  const [searchResults, setSearchResults] = useState({ users: [], groups: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
  const [friendRequests, setFriendRequests] = useState({
    sentRequests: [],
    receivedRequests: [],
  });
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
  const profileMenuRef = useRef(null);

  //notification using socket
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("user-online", user._id);

    socket.on("receive-notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      toast.success(notification.message);
    });

    return () => {
      socket.off("receive-notification");
    };
  }, [socket, user]);
  //closing of dorpdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        handleMenuClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const requests = await getFriendRequests();
        setFriendRequests(requests);
      } catch (error) {
        console.error("Failed to fetch friend requests:", error);
      }
    };

    if (isLoggedIn) {
      fetchFriendRequests();
    }
  }, [isLoggedIn]);

  const handleAddTag = (e) => {
    if (
      (e.key === "Enter" || e.type === "blur") &&
      tagInput &&
      !tags.includes(tagInput)
    ) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSearch = async () => {
    if (!query && tags.length === 0) return;
    try {
      if (searchType === "users") {
        const userData = await searchUsers(query);
        setSearchResults({ ...searchResults, users: userData });
      } else {
        // Pass both query and tags to search function
        const groupData = await searchPublicGroups(
          query || "",
          tags.length > 0 ? tags.join(",") : ""
        );
        setSearchResults({ ...searchResults, groups: groupData });
      }
    } catch (error) {
      console.error("Search failed", error);
    }
  };

  // Add effect to trigger search when tags change
  useEffect(() => {
    if (searchType === "groups") {
      handleSearch();
    }
  }, [tags]); // Add this effect

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout", {}, { withCredentials: true });
      navigateTo("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleNotificationClick = () => {
    setNotificationDropdownOpen(!notificationDropdownOpen);
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptFriendRequest(requestId);
      setFriendRequests((prev) => ({
        ...prev,
        receivedRequests: prev.receivedRequests.filter(
          (req) => req._id !== requestId
        ),
      }));
      toast.success("Friend request accepted!");
    } catch (error) {
      toast.error(error.message || "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectFriendRequest(requestId);
      setFriendRequests((prev) => ({
        ...prev,
        receivedRequests: prev.receivedRequests.filter(
          (req) => req._id !== requestId
        ),
      }));
      toast.success("Friend request rejected");
    } catch (error) {
      toast.error(error.message || "Failed to reject request");
    }
  };

  const renderNotificationsDropdown = () => (
    <div
      className={`absolute right-0 mt-2 w-80 bg-white text-black shadow-lg rounded-md z-20 ${
        notificationDropdownOpen ? "block" : "hidden"
      }`}
    >
      <div className="p-4">
        <h3 className="font-bold mb-3">Friend Requests</h3>
        {friendRequests.receivedRequests.length > 0 ? (
          friendRequests.receivedRequests.map((request) => (
            <div
              key={request._id}
              className="flex items-center justify-between p-2 border-b"
            >
              <span>{request.username}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAcceptRequest(request._id)}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRejectRequest(request._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No pending friend requests</p>
        )}
      </div>
    </div>
  );

  const menuId = "primary-search-account-menu";
  const renderMenu = (
    <div
      ref={profileMenuRef}
      className={`absolute right-0 mt-2 w-48 bg-gray-800 shadow-lg rounded-md z-10 ${
        isMenuOpen ? "block" : "hidden"
      }`}
    >
      <div
        className="p-2 hover:bg-gray-400 cursor-pointer block text-white"
        onClick={() => {
          console.log("Profile clicked, user:", user);
          if (!user?._id) {
            console.error("User ID not available");
            return;
          }
          navigateTo(`/userProfile/${user._id}`);
          // handleMenuClose();
        }}
      >
        Profile
      </div>
      <div
        className="p-2 hover:bg-gray-400 cursor-pointer"
        onClick={handleLogout}
      >
        Logout
      </div>
    </div>
  );

  const mobileMenuId = "primary-search-account-menu-mobile";
  const renderMobileMenu = (
    <div
      className={`absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-10 ${
        isMobileMenuOpen ? "block" : "hidden"
      }`}
    >
      <div className="p-2 flex items-center">
        <MailIcon />
        <span className="ml-2">Messages</span>
      </div>
      <div className="p-2 flex items-center">
        <NotificationsIcon />
        <span className="ml-2">Notifications</span>
      </div>
      <div className="p-2 flex items-center" onClick={handleProfileMenuOpen}>
        <AccountCircle />
        <span className="ml-2">Profile</span>
      </div>
      <div
        className="p-2 hover:bg-gray-100 cursor-pointer"
        onClick={handleLogout}
      >
        Logout
      </div>
    </div>
  );

  const renderSearchBar = () => (
    <div
      className={`transition-all ${
        searchOpen
          ? "fixed top-4 left-1/2 transform -translate-x-1/2 w-2/3 max-w-lg z-50"
          : "w-40"
      }`}
    >
      <div className="flex flex-col bg-white text-black rounded-lg shadow-lg">
        <div className="flex items-center px-4 py-2">
          <SearchIcon />
          <input
            type="text"
            placeholder={`Search ${searchType}...`}
            className="ml-2 outline-none w-full bg-transparent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={() => setSearchOpen(true)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          {searchOpen && (
            <button
              className="text-gray-500 hover:text-black"
              onClick={() => {
                setSearchOpen(false);
                setQuery("");
                setTags([]);
              }}
            >
              ✕
            </button>
          )}
        </div>
        {searchOpen && (
          <>
            <div className="px-4 py-2 border-t border-gray-200">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="searchType"
                  value="users"
                  checked={searchType === "users"}
                  onChange={(e) => {
                    setSearchType(e.target.value);
                    setTags([]);
                  }}
                />
                <span>Users</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="searchType"
                  value="groups"
                  checked={searchType === "groups"}
                  onChange={(e) => setSearchType(e.target.value)}
                />
                <span>Groups</span>
              </label>
            </div>

            {/* Add tags input for group search */}
            {searchType === "groups" && (
              <div className="px-4 py-2 border-t border-gray-200">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      #{tag}
                      <button
                        className="ml-1 text-blue-600 hover:text-blue-800"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tags (press Enter)"
                  className="w-full p-2 border rounded"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  onBlur={handleAddTag}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Search Results Dropdown */}
      {searchOpen && (query || tags.length > 0) && (
        <div className="absolute w-full bg-white text-black p-4 shadow-lg rounded-md mt-2">
          {searchType === "users" && searchResults.users.length > 0 ? (
            searchResults.users.map((user) => (
              <SearchResultItem
                key={user._id}
                user={user}
                onClick={() => setSearchOpen(false)}
              />
            ))
          ) : searchType === "groups" && searchResults.groups.length > 0 ? (
            searchResults.groups.map((group) => (
              <div
                key={group._id}
                className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  navigateTo(`/groupDetails/${group._id}`);
                  setSearchOpen(false);
                }}
              >
                <img
                  src={group.avatar || "/default-group.png"}
                  alt={group.name}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <div className="font-medium">{group.name}</div>
                  <div className="text-sm text-gray-500">
                    {group.tags.map((tag, index) => (
                      <span key={index} className="mr-2">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="p-2 text-gray-500">No results found</p>
          )}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <header className="flex justify-between items-center p-4 bg-gray-100 shadow-md">
        <div className="flex items-center">
          <div className="w-32 h-8 bg-gray-300 animate-pulse"></div>
        </div>
        <div className="flex items-center">
          <div className="w-24 h-10 bg-gray-300 animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-blue-600 text-white">
        <div className="container mx-auto flex justify-between items-center p-4">
          <h1 className="text-xl font-bold">Nexus</h1>
          <div>
            <ul className="flex items-center space-x-4">
              <li className="hover:bg-blue-700 hover:rounded-xl p-1">
                <Link to="/dashboard" className="nav-link ">
                  Dashboard
                </Link>
              </li>
              <li className="hover:bg-blue-700 hover:rounded-xl p-1">
                <Link to="/doubts" className="nav-link">
                  Discussion
                </Link>
              </li>
              <li className="hover:bg-blue-700 hover:rounded-xl p-1">
                <Link to="/room" className="nav-link">
                  Rooms
                </Link>
              </li>
              <li className="hover:bg-blue-700 hover:rounded-xl p-1">
                <Link to="/chats" className="nav-link">
                  Chats
                </Link>
              </li>
              <li className="hover:bg-blue-700 hover:rounded-xl p-1">
                <Link to="/mentors" className="nav-link">
                  Mentors
                </Link>
              </li>
              <li className="hover:bg-blue-700 hover:rounded-xl p-1">
                <Link to="/marketplace" className="nav-link">
                  Market
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex items-center space-x-4">
            {/* Blurred Overlay when search is active */}
            {searchOpen && (
              <div
                className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-md transition-all"
                onClick={() => setSearchOpen(false)}
              ></div>
            )}

            {/* Search Bar - Normal Position Initially, Moves to Center When Clicked */}
            {renderSearchBar()}

            <div className="relative">
              <button className="relative" onClick={handleNotificationClick}>
                <NotificationsIcon />
                {friendRequests.receivedRequests.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">
                    {friendRequests.receivedRequests.length}
                  </span>
                )}
              </button>
              {renderNotificationsDropdown()}
            </div>
            <button onClick={handleProfileMenuOpen}>
              <AccountCircle />
            </button>
            <button onClick={handleMobileMenuOpen} className="block md:hidden">
              <MoreIcon />
            </button>
          </div>
        </div>
        {renderMobileMenu}
        {renderMenu}
      </header>
    </>
  );
};

export default Header;
