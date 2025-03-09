import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MentorshipNavbar from './MentorshipNavbar';

const Applications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await axios.get('/api/admin/applications');
            console.log('Applications:', response.data);
            setApplications(response.data);
        } catch (error) {
            console.error('Error fetching applications:', error);
            setError('Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (applicationId, status, feedback = '') => {
        try {
            setError('');
            setSuccess('');

            const response = await axios.put('/api/admin/applications/status', {
                applicationId,
                status,
                feedback
            });

            setSuccess(response.data.message);
            // Refresh applications
            fetchApplications();
        } catch (error) {
            console.error('Error updating status:', error);
            setError(error.response?.data?.message || 'Failed to update status');
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
                        <h1 className="text-3xl font-bold mb-4">Mentor Applications</h1>
                        <p className="text-gray-400">Review and manage mentor applications</p>
                    </motion.div>

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

                    {/* Applications List */}
                    {loading ? (
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {applications.map(application => (
                                <motion.div
                                    key={application._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
                                >
                                    <div className="flex flex-col md:flex-row justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold mb-2">{application.studentId?.email}</h3>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {application.skills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 bg-green-900 text-green-300 rounded-full text-sm"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-gray-400">SPI: {application.spi}</p>
                                            <p className="text-gray-400">Status: {application.status}</p>
                                        </div>

                                        {application.status === 'pending' && (
                                            <div className="flex gap-2 mt-4 md:mt-0">
                                                <motion.button
                                                    onClick={() => handleStatusUpdate(application._id, 'approved')}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    Approve
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => handleStatusUpdate(application._id, 'rejected')}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    Reject
                                                </motion.button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Applications; 