import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MentorCard = ({ mentor, isDarkMode }) => {
    const navigate = useNavigate();
    const currentUserId = localStorage.getItem('userId');

    // Don't render if the mentor is the current user
    if (mentor._id === currentUserId) {
        return null;
    }

    const handleChatClick = () => {
        navigate(`/chat/${mentor._id}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                } rounded-lg shadow-lg p-6 mb-4 transform hover:scale-[1.02] transition-transform`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{mentor.username}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {mentor.email}
                    </p>

                    <div className="space-y-2">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{mentor.collegename}</span>
                        </div>

                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Skills:</span>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-7">
                            {mentor.skills?.map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>

                        {mentor.bio && (
                            <div className="mt-3">
                                <div className="flex items-center mb-2">
                                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="font-medium">Bio:</span>
                                </div>
                                <p className="text-sm ml-7 text-gray-600 dark:text-gray-300">
                                    {mentor.bio}
                                </p>
                            </div>
                        )}

                        {mentor.availability && (
                            <div className="flex items-center mt-3">
                                <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">Available: </span>
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                    {mentor.availability}
                                </span>
                            </div>
                        )}

                        {mentor.rating && (
                            <div className="flex items-center mt-3">
                                <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="font-medium">Rating: </span>
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                    {mentor.rating}/5
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleChatClick}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat
                </button>
            </div>
        </motion.div>
    );
};

export default MentorCard; 