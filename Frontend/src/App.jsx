import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DoubtsPage from "./pages/Doubt";
import QuestionDetail from "./pages/QuestionDetail";
import Room from "./pages/Room";
import StudyRoom from "./pages/StudyRoom";
import Marketplace from "./pages/Marketplace";
import { useSelector } from "react-redux";
import AddProduct from "./pages/AddProduct";


const App = () => {
  const user = useSelector((state) => state.auth.user);

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
        <Route path="/marketplace" element={<Marketplace user={user} />} />
        <Route path="/add-product" element={<AddProduct />} />
      </Routes>
    </Router>
  );
};

export default App;
