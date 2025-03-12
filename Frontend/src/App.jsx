import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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

const App = () => {
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
        </Route>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
