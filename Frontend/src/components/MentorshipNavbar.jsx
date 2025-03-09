import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

const MentorshipNavbar = ({ isDarkMode }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isAdmin = localStorage.getItem('adminInfo');

    const handleSignOut = async () => {
        try {
            if (isAdmin) {
                await axios.post('/api/admin/signout');
                navigate('/admin/login');
            } else {
                
                navigate('/');
            }
        } catch (error) {
            console.error('Signout error:', error);
        }
    };

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                    } shadow-lg fixed top-0 left-0 right-0 z-50`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo and Main Navigation */}
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <Link
                                    to="/"
                                    className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"
                                >
                                    Mentorship Portal
                                </Link>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {isAdmin ? (
                                    <>
                                        <Link
                                            to="/admin/dashboard"
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname === '/admin/dashboard'
                                                ? 'border-green-500 text-green-500'
                                                : 'border-transparent hover:border-green-300'
                                                }`}
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/admin/applications"
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname === '/admin/applications'
                                                ? 'border-green-500 text-green-500'
                                                : 'border-transparent hover:border-green-300'
                                                }`}
                                        >
                                            Applications
                                        </Link>
                                        <Link
                                            to="/admin/forward-admin"
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname === '/admin/forward-admin'
                                                ? 'border-green-500 text-green-500'
                                                : 'border-transparent hover:border-green-300'
                                                }`}
                                        >
                                            Forward Admin
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/mentor/apply"
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname === '/mentor/apply'
                                                ? 'border-green-500 text-green-500'
                                                : 'border-transparent hover:border-green-300'
                                                }`}
                                        >
                                            Apply as Mentor
                                        </Link>
                                        <Link
                                            to="/mentor/status"
                                            className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname === '/mentor/status'
                                                ? 'border-green-500 text-green-500'
                                                : 'border-transparent hover:border-green-300'
                                                }`}
                                        >
                                            Application Status
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right side buttons */}
                        <div className="flex items-center">
                            <motion.button
                                onClick={handleSignOut}
                                className={`px-4 py-2 rounded-lg ${isDarkMode
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-red-500 hover:bg-red-600'
                                    } text-white transition-colors`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Sign Out
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        {isAdmin ? (
                            <>
                                <Link
                                    to="/admin/dashboard"
                                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/admin/dashboard'
                                        ? 'bg-green-500 text-white'
                                        : `${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
                                        }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/admin/applications"
                                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/admin/applications'
                                        ? 'bg-green-500 text-white'
                                        : `${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
                                        }`}
                                >
                                    Applications
                                </Link>
                                <Link
                                    to="/admin/forward-admin"
                                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/admin/forward-admin'
                                        ? 'bg-green-500 text-white'
                                        : `${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
                                        }`}
                                >
                                    Forward Admin
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/mentor/apply"
                                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/mentor/apply'
                                        ? 'bg-green-500 text-white'
                                        : `${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
                                        }`}
                                >
                                    Apply as Mentor
                                </Link>
                                <Link
                                    to="/mentor/status"
                                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/mentor/status'
                                        ? 'bg-green-500 text-white'
                                        : `${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
                                        }`}
                                >
                                    Application Status
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </motion.nav>
        </>
    );
};

export default MentorshipNavbar; 