import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Use useNavigate instead of useHistory

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false); // Flag to track if OTP has been sent
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate(); // useNavigate hook to handle navigation


  const handleUsernameChange = (e) => setUsername(e.target.value);


  const handlePasswordChange = (e) => setPassword(e.target.value);


  const handleOtpChange = (e) => setOtp(e.target.value);


  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3000/login", { username, password });
      if (response.status === 200) {
        setOtpSent(true);
        setError(""); 
      }
    } catch (error) {
      setError("Invalid username or password");
    }
  };

  
  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:3000/verify-login", { username, otp });
      if (response.status === 200) {
        localStorage.setItem("token", response.data.token);
        setIsLoggedIn(true);
        setError("");
        navigate("/dashboard"); 
      }
    } catch (error) {
      setError("Invalid OTP");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        {!otpSent ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300"
            >
              Verify OTP
            </button>
          </form>
        )}
        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
};

export default Login;
