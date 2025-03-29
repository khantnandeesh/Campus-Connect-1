import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const MentorApplicationForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        skills: [''],
        achievements: [{ title: '', description: '', date: '' }],
        internships: [{ company: '', position: '', duration: '', description: '' }],
        spi: ''
    });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        checkApplicationStatus();
        // Check system preference for dark mode
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(prefersDark);
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    const checkApplicationStatus = async () => {
        try {
            const response = await axios.get('https://campus-connect-1-7rgs.onrender.com/api/mentor/status', {
                withCredentials: true
            });
            setApplicationStatus(response.data);
        } catch (error) {
            if (error.response?.status === 404) {
                setApplicationStatus(null); // No application found
            } else {
                setMessage('Error checking application status');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkillChange = (index, value) => {
        const newSkills = [...formData.skills];
        newSkills[index] = value;
        setFormData({ ...formData, skills: newSkills });
    };

    const addSkill = () => {
        setFormData({ ...formData, skills: [...formData.skills, ''] });
    };

    const handleAchievementChange = (index, field, value) => {
        const newAchievements = [...formData.achievements];
        newAchievements[index] = { ...newAchievements[index], [field]: value };
        setFormData({ ...formData, achievements: newAchievements });
    };

    const addAchievement = () => {
        setFormData({
            ...formData,
            achievements: [...formData.achievements, { title: '', description: '', date: '' }]
        });
    };

    const handleInternshipChange = (index, field, value) => {
        const newInternships = [...formData.internships];
        newInternships[index] = { ...newInternships[index], [field]: value };
        setFormData({ ...formData, internships: newInternships });
    };

    const addInternship = () => {
        setFormData({
            ...formData,
            internships: [...formData.internships, { company: '', position: '', duration: '', description: '' }]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            if (isEditing) {
                // If editing, use the update endpoint
                const response = await axios.put('https://campus-connect-1-7rgs.onrender.com/api/mentor/update-application', formData, {
                    withCredentials: true
                });
                console.log('Update response:', response.data);
                setMessage('Application updated successfully!');
            } else {
                // If new submission, use the apply endpoint
                const response = await axios.post('https://campus-connect-1-7rgs.onrender.com/api/mentor/apply', formData, {
                    withCredentials: true
                });
                console.log('Submit response:', response.data);
                setMessage('Application submitted successfully!');
            }

            // Reset form and refresh status
            setFormData({
                skills: [''],
                achievements: [{ title: '', description: '', date: '' }],
                internships: [{ company: '', position: '', duration: '', description: '' }],
                spi: ''
            });
            setIsEditing(false);
            checkApplicationStatus();
        } catch (error) {
            console.error('Error:', error.response?.data || error);
            setMessage(
                error.response?.data?.message ||
                error.response?.data?.error ||
                'Error submitting application'
            );
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleEdit = () => {
        console.log("Starting edit mode with application data:", applicationStatus);
        setIsEditing(true);
        // Ensure we have all the required fields
        const formDataToSet = {
            skills: applicationStatus.skills || [''],
            achievements: applicationStatus.achievements || [{ title: '', description: '', date: '' }],
            internships: applicationStatus.internships || [{ company: '', position: '', duration: '', description: '' }],
            spi: applicationStatus.spi || ''
        };
        console.log("Setting form data:", formDataToSet);
        setFormData(formDataToSet);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        checkApplicationStatus();
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const stepVariants = {
        enter: { x: 1000, opacity: 0 },
        center: { zIndex: 1, x: 0, opacity: 1 },
        exit: { zIndex: 0, x: -1000, opacity: 0 }
    };

    if (isLoading) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} p-8 flex items-center justify-center`}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <div className={`w-16 h-16 border-4 ${isDarkMode ? 'border-green-500' : 'border-green-600'} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
                    <p className={`text-xl ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Loading...</p>
                </motion.div>
            </div>
        );
    }

    if (applicationStatus && !isEditing) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} p-8`}>
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-end mb-4">
                        <motion.button
                            onClick={toggleDarkMode}
                            className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {isDarkMode ? '🌞' : '🌙'}
                        </motion.button>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-8 rounded-lg border ${isDarkMode ? 'border-green-500' : 'border-green-600'} shadow-lg ${isDarkMode ? 'shadow-green-500/20' : 'shadow-green-600/20'}`}
                    >
                        <h1 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500">
                            Application Status
                        </h1>

                        <div className="space-y-6">
                            <div className="flex items-center justify-center">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${applicationStatus.status === 'pending' ? 'bg-yellow-500' :
                                    applicationStatus.status === 'approved' ? 'bg-green-500' :
                                        'bg-red-500'
                                    }`}>
                                    <span className="text-4xl">
                                        {applicationStatus.status === 'pending' ? '⏳' :
                                            applicationStatus.status === 'approved' ? '✓' :
                                                '✕'}
                                    </span>
                                </div>
                            </div>

                            <div className="text-center">
                                <h2 className="text-2xl font-semibold mb-2 text-green-400">
                                    {applicationStatus.status === 'pending' ? 'Application Under Review' :
                                        applicationStatus.status === 'approved' ? 'Application Approved!' :
                                            'Application Rejected'}
                                </h2>
                                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                    {applicationStatus.status === 'pending' ?
                                        'Your application is being reviewed by our team. We will notify you once a decision is made.' :
                                        applicationStatus.status === 'approved' ?
                                            'Congratulations! Your application has been approved. You can now mentor students.' :
                                            'We regret to inform you that your application has been rejected. You can apply again after 30 days.'}
                                </p>
                            </div>

                            {applicationStatus.status === 'pending' && (
                                <div className={`mt-8 p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg border ${isDarkMode ? 'border-green-500' : 'border-green-600'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold text-green-400">Application Details</h3>
                                        <motion.button
                                            onClick={handleEdit}
                                            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Edit Application
                                        </motion.button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Skills</h4>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {applicationStatus.skills.map((skill, index) => (
                                                    <span key={index} className={`px-3 py-1 ${isDarkMode ? 'bg-green-900' : 'bg-green-100'} rounded-full text-sm ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Achievements</h4>
                                            <div className="space-y-2 mt-2">
                                                {applicationStatus.achievements.map((achievement, index) => (
                                                    <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                        <h5 className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{achievement.title}</h5>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{achievement.description}</p>
                                                        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{new Date(achievement.date).toLocaleDateString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Internships</h4>
                                            <div className="space-y-2 mt-2">
                                                {applicationStatus.internships.map((internship, index) => (
                                                    <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                        <h5 className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{internship.position} at {internship.company}</h5>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{internship.duration}</p>
                                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{internship.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>SPI</h4>
                                            <p className={`text-xl ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{applicationStatus.spi}</p>
                                        </div>
                                        <div>
                                            <h4 className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Applied On</h4>
                                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                {new Date(applicationStatus.appliedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} p-8`}>
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"
                    >
                        {isEditing ? 'Edit Application' : 'Mentor Application Form'}
                    </motion.h1>
                    <motion.button
                        onClick={toggleDarkMode}
                        className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isDarkMode ? '🌞' : '🌙'}
                    </motion.button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= step
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-gray-700 text-gray-400'
                                    }`}>
                                    {step}
                                </div>
                                {step < 4 && (
                                    <div className={`w-24 h-1 mx-2 ${currentStep > step ? 'bg-purple-500' : 'bg-gray-700'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                        <span>Skills</span>
                        <span>Achievements</span>
                        <span>Internships</span>
                        <span>Academic</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div
                                key="skills"
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="bg-gray-900 p-6 rounded-lg border border-purple-500 shadow-lg shadow-purple-500/20"
                            >
                                <h2 className="text-2xl font-semibold mb-4 text-purple-400">Skills</h2>
                                {formData.skills.map((skill, index) => (
                                    <motion.div
                                        key={index}
                                        className="mb-4"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <input
                                            type="text"
                                            value={skill}
                                            onChange={(e) => handleSkillChange(index, e.target.value)}
                                            className="w-full bg-gray-800 border border-purple-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                            placeholder="Enter skill"
                                            required
                                        />
                                    </motion.div>
                                ))}
                                <motion.button
                                    type="button"
                                    onClick={addSkill}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Add Skill
                                </motion.button>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="achievements"
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="bg-gray-900 p-6 rounded-lg border border-purple-500 shadow-lg shadow-purple-500/20"
                            >
                                <h2 className="text-2xl font-semibold mb-4 text-purple-400">Achievements</h2>
                                {formData.achievements.map((achievement, index) => (
                                    <motion.div
                                        key={index}
                                        className="mb-4 space-y-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <input
                                            type="text"
                                            value={achievement.title}
                                            onChange={(e) => handleAchievementChange(index, 'title', e.target.value)}
                                            className="w-full bg-gray-800 border border-purple-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                            placeholder="Achievement title"
                                            required
                                        />
                                        <textarea
                                            value={achievement.description}
                                            onChange={(e) => handleAchievementChange(index, 'description', e.target.value)}
                                            className="w-full bg-gray-800 border border-purple-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                            placeholder="Description"
                                            required
                                        />
                                        <input
                                            type="date"
                                            value={achievement.date}
                                            onChange={(e) => handleAchievementChange(index, 'date', e.target.value)}
                                            className="w-full bg-gray-800 border border-purple-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                            required
                                        />
                                    </motion.div>
                                ))}
                                <motion.button
                                    type="button"
                                    onClick={addAchievement}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Add Achievement
                                </motion.button>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="internships"
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="bg-gray-900 p-6 rounded-lg border border-purple-500 shadow-lg shadow-purple-500/20"
                            >
                                <h2 className="text-2xl font-semibold mb-4 text-purple-400">Internships</h2>
                                {formData.internships.map((internship, index) => (
                                    <motion.div
                                        key={index}
                                        className="mb-4 space-y-2"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <input
                                            type="text"
                                            value={internship.company}
                                            onChange={(e) => handleInternshipChange(index, 'company', e.target.value)}
                                            className="w-full bg-gray-800 border border-purple-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                            placeholder="Company name"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={internship.position}
                                            onChange={(e) => handleInternshipChange(index, 'position', e.target.value)}
                                            className="w-full bg-gray-800 border border-purple-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                            placeholder="Position"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={internship.duration}
                                            onChange={(e) => handleInternshipChange(index, 'duration', e.target.value)}
                                            className="w-full bg-gray-800 border border-purple-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                            placeholder="Duration (e.g., 3 months)"
                                            required
                                        />
                                        <textarea
                                            value={internship.description}
                                            onChange={(e) => handleInternshipChange(index, 'description', e.target.value)}
                                            className="w-full bg-gray-800 border border-purple-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                            placeholder="Description"
                                            required
                                        />
                                    </motion.div>
                                ))}
                                <motion.button
                                    type="button"
                                    onClick={addInternship}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Add Internship
                                </motion.button>
                            </motion.div>
                        )}

                        {currentStep === 4 && (
                            <motion.div
                                key="academic"
                                variants={stepVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="bg-gray-900 p-6 rounded-lg border border-purple-500 shadow-lg shadow-purple-500/20"
                            >
                                <h2 className="text-2xl font-semibold mb-4 text-purple-400">Academic Performance</h2>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <input
                                        type="number"
                                        value={formData.spi}
                                        onChange={(e) => setFormData({ ...formData, spi: e.target.value })}
                                        className="w-full bg-gray-800 border border-purple-500 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                        placeholder="Enter your SPI"
                                        step="0.01"
                                        min="0"
                                        max="10"
                                        required
                                    />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded ${message.includes('successfully') ? 'bg-green-900' : 'bg-red-900'}`}
                        >
                            {message}
                        </motion.div>
                    )}

                    <div className="flex justify-between mt-8">
                        {isEditing && (
                            <motion.button
                                type="button"
                                onClick={handleCancelEdit}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Cancel Edit
                            </motion.button>
                        )}
                        {!isEditing && (
                            <motion.button
                                type="button"
                                onClick={prevStep}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={currentStep === 1}
                            >
                                Previous
                            </motion.button>
                        )}
                        {currentStep === 4 ? (
                            <motion.button
                                type="submit"
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors disabled:opacity-50"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {loading ? 'Submitting...' : isEditing ? 'Update Application' : 'Submit Application'}
                            </motion.button>
                        ) : (
                            <motion.button
                                type="button"
                                onClick={nextStep}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Next
                            </motion.button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MentorApplicationForm; 