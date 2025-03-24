import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const ForwardAdmin = () => {
    const [users, setUsers] = useRecoilState(usersState);
    const [loading, setLoading] = useRecoilState(loadingState);
    const [error, setError] = useRecoilState(errorState);
    const [success, setSuccess] = useRecoilState(successState);
    const [searchTerm, setSearchTerm] = useRecoilState(searchTermState);
    const [isDarkMode] = useRecoilState(darkModeState);
    const navigate = useNavigate();
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [makingAdmin, setMakingAdmin] = useState(null);

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

    useEffect(() => {
        if (searchTimeout) clearTimeout(searchTimeout);

        const timeoutId = setTimeout(() => {
            if (searchTerm.trim()) {
                fetchUsers();
            }
        }, 500);

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

            setSearchLoading(true);
            setError('');

            let response;
            if (!searchTerm.trim()) {
                response = await axios.get('/api/admin/non-mentor-users');
            } else {
                response = await axios.get('/api/admin/search-users', {
                    params: { searchTerm: searchTerm.trim() }
                });
            }

            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError(error.response?.data?.message || 'Failed to fetch users');
            setUsers([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleForwardAdmin = async (userId, email) => {
        try {
            setError('');
            setSuccess('');
            setMakingAdmin(userId);

            const response = await axios.post('/api/admin/create-admin', {
                userId,
                email
            });

            setSuccess(response.data.message);
            await fetchUsers();
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to create admin');
        } finally {
            setMakingAdmin(null);
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
                        <h1 className="text-3xl font-bold mb-4">Forward Admin</h1>
                        <p className="text-gray-400">Search and select users to make them administrators</p>
                    </motion.div>

                    {/* Search Bar with Loading Indicator */}
                    <div className="mb-6 relative">
                        <input
                            type="email"
                            placeholder="Enter user email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                                } border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500`}
                        />
                        {searchLoading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-red-900 text-white p-4 rounded-lg mb-4"
                            >
                                {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="bg-green-900 text-white p-4 rounded-lg mb-4"
                            >
                                {success}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Search Results Count */}
                    {!searchLoading && (
                        <div className="mb-4 text-gray-400">
                            Found {users.length} user{users.length !== 1 ? 's' : ''}
                            {searchTerm && ` matching "${searchTerm}"`}
                        </div>
                    )}

                    {/* Users List */}
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
                                    <div className="w-full">
                                        <h3 className="text-xl font-semibold mb-2 truncate">
                                            {user.username}
                                        </h3>
                                        <p className="text-gray-400 text-sm mb-1 truncate">
                                            {user.email}
                                        </p>
                                        <p className="text-gray-400 text-sm mb-3">
                                            College: {user.collegename}
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={() => handleForwardAdmin(user._id, user.email)}
                                    disabled={makingAdmin === user._id}
                                    className={`mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors relative ${makingAdmin === user._id ? 'opacity-75' : ''
                                        }`}
                                    whileHover={{ scale: makingAdmin === user._id ? 1 : 1.02 }}
                                    whileTap={{ scale: makingAdmin === user._id ? 1 : 0.98 }}
                                >
                                    {makingAdmin === user._id ? (
                                        <div className="flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Making Admin...
                                        </div>
                                    ) : (
                                        'Make Admin'
                                    )}
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>

                    {/* No Results Message */}
                    {!searchLoading && users.length === 0 && (
                        <div className="text-center text-gray-400 mt-8">
                            No users found {searchTerm && 'matching your search'}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ForwardAdmin; 