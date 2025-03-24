import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { darkModeState } from '../atoms/mentorshipAtoms';
import MentorCard from './MentorCard';
import MentorshipNavbar from './MentorshipNavbar';
import axios from 'axios';

const MentorList = () => {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDarkMode] = useRecoilState(darkModeState);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);

    const fetchMentors = async (search = '') => {
        try {
            setLoading(true);
            const response = await axios.post('/api/mentors/college',
                { search },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            console.log("Mentors received:", response.data);
            setMentors(response.data.map(mentor => {
                
                console.log('Mentor Ratings:', mentor.ratings);
                const userRating = mentor.ratings.find(rating => rating.userId === localStorage.getItem('userId'));
                console.log('User Rating:', userRating);
                return {
                    ...mentor,
                    userRating: userRating ? userRating.stars : 0
                };
            }));

            const skills = new Set();
            response.data.forEach(mentor => {
                mentor.skills?.forEach(skill => skills.add(skill));
            });
            setAvailableSkills(Array.from(skills));
            setLoading(false);
        } catch (err) {
            console.error("Error fetching mentors:", err);
            setError(err.response?.data?.message || 'Failed to fetch mentors');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMentors();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchMentors(searchTerm);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const filteredMentors = mentors.filter(mentor => {
        const matchesSkills = selectedSkills.length === 0 ||
            selectedSkills.every(skill => mentor.skills?.includes(skill));
        return matchesSkills;
    });

    return (
        <>
            {/* <MentorshipNavbar isDarkMode={isDarkMode} /> */}
            <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-gray-50'} pt-20 px-4`}>
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Search mentors by email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} shadow-md`}
                        />
                    </div>

                    <div className="mb-6">
                        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Filter by Skills:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {availableSkills.map((skill) => (
                                <button
                                    key={skill}
                                    onClick={() => {
                                        setSelectedSkills(prev =>
                                            prev.includes(skill)
                                                ? prev.filter(s => s !== skill)
                                                : [...prev, skill]
                                        );
                                    }}
                                    className={`px-3 py-1 rounded-full text-sm ${selectedSkills.includes(skill)
                                        ? 'bg-green-600 text-white'
                                        : isDarkMode
                                            ? 'bg-gray-700 text-white'
                                            : 'bg-gray-200 text-gray-800'
                                        } transition-colors`}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative min-h-[400px]">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                                    <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Loading mentors...
                                    </p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-red-500 text-center">
                                    <p className="text-xl mb-2">Error</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        ) : filteredMentors.length === 0 ? (
                            <div className={`text-center py-10 ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>
                                No mentors found matching your criteria
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredMentors.map((mentor) => (
                                    <MentorCard
                                        key={mentor._id}
                                        mentor={mentor}
                                        isDarkMode={isDarkMode}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default MentorList; 