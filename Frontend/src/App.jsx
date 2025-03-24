import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DoubtsPage from "./pages/Doubt";
import QuestionDetail from "./pages/QuestionDetail";
import Room from "./pages/Room";
import StudyRoom from "./pages/StudyRoom";
import UserProfile from "./pages/UserProfile"; // Import the new component
import Profile from "./pages/Profile";
import Layout from "./pages/Layout"; // Import the Layout component
import ChatPage from "./pages/ChatPage";
import GroupDetails from "./pages/GroupDetails"; // Import the new component
import Marketplace from "./pages/Marketplace";
import { useSelector } from "react-redux";
import AddProduct from "./pages/AddEditProduct";
import AddEditProduct from "./pages/AddEditProduct";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import MyListings from "./pages/MyListings";
import SellerChatPage from "./pages/SellerChatPage";
import ChatInbox from "./pages/ChatInbox";
import MyOrders from "./pages/MyOrders";

const App = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route element={<Layout />}>
          <Route path="*" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/doubts" element={<DoubtsPage />} />
          <Route path="/questions/:questionId" element={<QuestionDetail />} />
          <Route path="/room" element={<Room />} />
          <Route path="/room/:roomId" element={<StudyRoom />} />
          <Route path="/userProfile/:userId" element={<Profile />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
          <Route path="/chats" element={<ChatPage />} />
          <Route path="/groupDetails/:groupId" element={<GroupDetails />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<ProductDetails />} />
          <Route path="/marketplace/add" element={<AddEditProduct />} />
          <Route path="/marketplace/edit/:id" element={<AddEditProduct />} />
          <Route path="/marketplace/wishlist" element={<Wishlist />} />
          <Route path="/marketplace/listings" element={<MyListings />} />
          <Route path="/marketplace/orders" element={<MyOrders />} />
          <Route path="/chat/:sellerId" element={<SellerChatPage />} />
          <Route path="/chat/inbox" element={<ChatInbox />} />
        </Route>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
