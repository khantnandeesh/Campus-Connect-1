import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DoubtsPage from "./pages/Doubt";
import QuestionDetail from "./pages/QuestionDetail";
import Room from "./pages/Room";
import StudyRoom from "./pages/StudyRoom";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/doubts" element={<DoubtsPage />} />
        <Route path="/questions/:questionId" element={<QuestionDetail />} />
        <Route path="/room" element={<Room />} />
        <Route path="/room/:roomId" element={<StudyRoom />} />
      </Routes>
    </Router>
  );
};

export default App;
