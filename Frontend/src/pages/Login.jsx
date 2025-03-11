import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { userState } from '../atoms/userAtoms';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setUser = useSetRecoilState(userState);

  const handleUsernameChange = (e) => setUsername(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleOtpChange = (e) => setOtp(e.target.value);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when the request is being made
    try {
      const response = await axios.post(
        'http://localhost:3000/auth/login',
        { username, password },
        { withCredentials: true }
      );
      if (response.status === 200) {
        setOtpSent(true);
        setError('');
      }
    } catch (error) {
      setError(error.response ? error.response.data.message : 'An error occurred');
    } finally {
      setLoading(false); // Set loading to false after the request finishes
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when the request is being made
    try {
      const response = await axios.post(
        'http://localhost:3000/auth/verify-login',
        { username, otp },
        { withCredentials: true }
      );
      if (response.data.token) {
      


        navigate('/dashboard');
      }
    } catch (error) {
      console.log(error);
      setError(error.response ? error.response.data.message : 'An error occurred');
    } finally {
      setLoading(false); // Set loading to false after the request finishes
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:3000/auth/resend-otp',
        { username },
        { withCredentials: true }
      );
      if (response.status === 200) {
        setError('');
        alert('OTP has been resent!');
      }
    } catch (error) {
      setError(error.response ? error.response.data.message : 'An error occurred');
    } finally {
      setLoading(false);
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
              disabled={loading} // Disable button while loading
            >
              {loading ? 'Loading...' : 'Login'}
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
              disabled={loading} // Disable button while loading
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-blue-500 hover:text-blue-700"
                disabled={loading} // Disable button while loading
              >
                Resend OTP
              </button>
            </div>
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
