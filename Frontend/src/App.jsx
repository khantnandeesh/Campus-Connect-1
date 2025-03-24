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
import MentorApplicationForm from './components/MentorApplicationForm';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import ForwardAdmin from './components/ForwardAdmin';
import Applications from './components/Applications';
import { RecoilRoot } from 'recoil';
import MentorList from './components/MentorList';
import Chat from './pages/Chat';
import WebSocketProvider from './components/WebSocketProvider';
import FindUsers from './pages/FindUsers';

// Protected Route Component
const ProtectedAdminRoute = ({ children }) => {
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));

  if (!adminInfo) {
    return <Navigate to="/admin/login" />;
  }

  return children;
};
const App = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <RecoilRoot>
      <WebSocketProvider>
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
          <Route path="/mentor-application" element={<MentorApplicationForm />} />
            <Route path="/chat/:userId/:receiverId" element={<Chat />} />
            <Route path="/find-users/:userId" element={<FindUsers />} />
            <Route path="/mentors" element={<MentorList />} />
        </Route>
         {/* Admin Routes */}
         <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/applications"
              element={
                <ProtectedAdminRoute>
                  <Applications />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/forward-admin"
              element={
                <ProtectedAdminRoute>
                  <ForwardAdmin />
                </ProtectedAdminRoute>
              }
            />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
      </WebSocketProvider>
      </RecoilRoot>
  );
};

export default App;
