import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import MentorshipNavbar from './MentorshipNavbar';
import {
    darkModeState,
    usersState,
    searchTermState,
    loadingState,
    errorState,
    successState
} from '../atoms/mentorshipAtoms';

const ForwardMentor = () => {
    const [users, setUsers] = useRecoilState(usersState);
    const [loading, setLoading] = useRecoilState(loadingState);
    const [error, setError] = useRecoilState(errorState);
    const [success, setSuccess] = useRecoilState(successState);
    const [searchTerm, setSearchTerm] = useRecoilState(searchTermState);
    const [isDarkMode] = useRecoilState(darkModeState);
    const navigate = useNavigate();
    const [searchTimeout, setSearchTimeout] = useState(null);

    useEffect(() => {
        fetchUsers();
        return () => {
            if (searchTimeout) clearTimeout(searchTimeout);
            setUsers([]);
            setSearchTerm('');
            setError('');
            setSuccess('');
        };
    }, []);

    // Add debounced search effect
    useEffect(() => {
        if (searchTimeout) clearTimeout(searchTimeout);

        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 500); // Debounce for 500ms

        setSearchTimeout(timeoutId);

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [searchTerm]);

    const fetchUsers = async () => {
        try {
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
            if (!adminInfo) {
                navigate('/admin/login');
                return;
            }

            setLoading(true);
            setError('');

            // If no search term, get all non-mentor users
            if (!searchTerm.trim()) {
                const response = await axios.get('/api/admin/non-mentor-users');
                console.log('All users fetched:', response.data);
                setUsers(response.data);
                return;
            }

            // If search term exists, search for specific email
            const response = await axios.get('/api/admin/search-users', {
                params: { searchTerm: searchTerm.trim() }
            });

            console.log('Search results:', response.data);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError(error.response?.data?.message || 'Failed to fetch users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleForwardMentor = async (userId, email) => {
        try {
            setError('');
            setSuccess('');

            const response = await axios.post('/api/admin/create-mentor', {
                userId,
                email
            });

            setSuccess(response.data.message);
            // Remove the user from the list and refresh search
            await fetchUsers();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create mentor');
        }
    };

    return (
        <>
            <MentorshipNavbar isDarkMode={isDarkMode} />
            <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} pt-20 p-8`}>
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-bold mb-4">Forward Mentor</h1>
                        <p className="text-gray-400">Search and select users to make them mentors</p>
                    </motion.div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Enter exact email address..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full p-3 rounded-lg ${isDarkMode
                                    ? 'bg-gray-800 text-white'
                                    : 'bg-white text-gray-900'
                                    } border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500`}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <p className="mt-2 text-sm text-gray-400">
                            Enter the complete email address to search for a specific user
                        </p>
                    </div>

                    {/* Messages */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-red-900 text-white p-4 rounded-lg mb-4"
                        >
                            {error}
                        </motion.div>
                    )}

                    {success && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-green-900 text-white p-4 rounded-lg mb-4"
                        >
                            {success}
                        </motion.div>
                    )}

                    {/* Users List */}
                    {loading ? (
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : (
                        <>
                            {/* Search Results Count */}
                            <div className="mb-4 text-gray-400">
                                Found {users.length} user{users.length !== 1 ? 's' : ''}
                                {searchTerm && ` matching "${searchTerm}"`}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {users.map(user => (
                                    <motion.div
                                        key={user._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                                            } shadow-lg`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">{user.email}</h3>
                                                <p className="text-gray-400 text-sm">SPI: {user.spi || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <motion.button
                                            onClick={() => handleForwardMentor(user._id, user.email)}
                                            className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Make Mentor
                                        </motion.button>
                                    </motion.div>
                                ))}
                            </div>

                            {/* No Results Message */}
                            {users.length === 0 && (
                                <div className="text-center text-gray-400 mt-8">
                                    No users found {searchTerm && 'matching your search'}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default ForwardMentor; 