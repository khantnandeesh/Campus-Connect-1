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
  const [searchResults, setSearchResults] = useState([]);
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

  const handleSearch = async () => {
    if (!query) return;
    try {
      const data = await searchUsers(query);
      setSearchResults(data);
    } catch (error) {
      console.error("Search failed", error);
    }
  };

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
          if (!user?.id) {
            console.error("User ID not available");
            return;
          }
          navigateTo(`/userProfile/${user.id}`);
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
                <Link to="/message" className="nav-link">
                  Chat
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
            <div
              className={`transition-all ${
                searchOpen
                  ? "fixed top-4 left-1/2 transform -translate-x-1/2 w-2/3 max-w-lg z-50"
                  : "w-40"
              }`}
            >
              <div className="flex items-center bg-white text-black rounded-full px-4 py-2 shadow-lg relative">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="ml-2 outline-none w-full bg-transparent"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onClick={() => setSearchOpen(true)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                {searchOpen && (
                  <button
                    className="absolute right-4 text-gray-500 hover:text-black"
                    onClick={() => {
                      setSearchOpen(false);
                      setQuery("");
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {searchOpen && query && (
                <div className="absolute w-full bg-white text-black p-4 shadow-lg rounded-md mt-2 z-50">
                  {searchResults.length > 0 ? (
                    searchResults.map((currUser) => (
                      <SearchResultItem
                        key={currUser._id}
                        user={currUser}
                        onClick={() => setSearchOpen(false)}
                      />
                    ))
                  ) : (
                    <p className="p-2 text-gray-500">No results found</p>
                  )}
                </div>
              )}
            </div>

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
