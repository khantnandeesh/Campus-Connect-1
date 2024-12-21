import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [collagename, setCollagename] = useState('');
  const [colleges, setColleges] = useState([]);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        console.log("fetching data!");

        const response = await axios.get('http://localhost:3000/colleges');
        setColleges(response.data.colleges);
        console.log(response.data.colleges);
      } catch (error) {
        console.error('Error fetching colleges', error);
      }
    };

    fetchColleges();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password || !email || !collagename) {
      alert('All fields are required!');
      return;
    }

    if (password.length !== 8) {
      alert('Password must be 8 characters long');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/signup', { username, password, email, collagename });

      if (response.status === 200) {
        alert('OTP sent to your email! Please verify.');
        setOtpSent(true);
      }
    } catch (error) {
      console.error('Error during signup', error);
      alert('Error during signup: ' + error.response?.data?.message || error.message);
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();

    if (!otp) {
      alert('Please enter OTP!');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/verify-signup', { username, password, email, collagename, otp });

      if (response.status === 201) {
        alert('Signup successful! Redirecting to login page...');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error during OTP verification', error);
      alert('Invalid OTP or expired OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Signup</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">College Name</label>
            <select
              value={collagename}
              onChange={(e) => setCollagename(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select College</option>
              {colleges.map((college, index) => (
                <option key={index} value={college}>
                  {college}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Submit
          </button>
        </form>

        {otpSent && !otpVerified && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-900 text-center">Enter OTP sent to your email</h3>
            <form onSubmit={handleOtpVerification} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Verify OTP
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;
