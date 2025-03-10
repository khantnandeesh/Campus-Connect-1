import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get("http://localhost:3000/auth/dashboard", {
          withCredentials: true,
        });
        console.log(response.data);
        setUser(response.data.user);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("Unauthorized: Please log in");
          navigate("/login");
        } else {
          setError("An error occurred while loading the dashboard");
        }
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (loading) {
    return <div className="text-center text-gray-700">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-2xl bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center">Dashboard</h1>
        <p className="text-gray-600 mt-4 text-center">
          Welcome, <strong>{user?.username || "User"}</strong>!
        </p>
        <p className="text-gray-600 mt-2 text-center">
          Your email: <strong>{user?.email}</strong>
        </p>
        <div className="mt-6 flex justify-center">
          <button
            className="px-4 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600"
            onClick={async () => {
              try {
                await axios.post("http://localhost:3000/auth/api/auth/logout", {}, { withCredentials: true });
                navigate("/login");
              } catch (err) {
                console.error("Logout failed", err);
              }
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
