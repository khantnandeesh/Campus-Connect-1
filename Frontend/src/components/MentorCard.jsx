import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactStars from "react-rating-stars-component";
import axios from 'axios';
import { useState,useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { userState} from '../atoms/userAtoms';

const MentorCard = ({ mentor, isDarkMode }) => {
    let [userId, setUserId] = useState(null);
    useEffect(() => {
          axios.get("http://localhost:3000/auth/dashboard", {
            withCredentials: true,
          }).then((response) => {
            setUserId(response.data.user.id);
          });
          
    }, []);

    const [stars, setStars] = useState(mentor.stars);
    const navigate = useNavigate();
    const user = useRecoilValue(userState);

    const handleChatClick = () => {
        navigate(`/chat/${mentor._id}`, { state: { mentorId: mentor._id, userId} });
    };

    const handleRatingChange = async (newRating) => {
        try {
            const response = await axios.put('/api/mentor/update-stars', {
                applicationId: mentor._id,
                stars: newRating
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            console.log(response.data.message);
            setStars(newRating);
        } catch (error) {
            console.error('Error updating stars:', error);
        }
    };

    return (
        <div
            className={`max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
        >
            <div className="p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{mentor.username}</h3>
                    <button
                        onClick={handleChatClick}
                        className="bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors"
                    >
                        Chat
                    </button>
                </div>
                <p className="text-sm mt-1 text-gray-500">{mentor.email}</p>
                <div className="mt-4">
                    <p className="text-sm font-semibold">College</p>
                    <p className="text-sm text-gray-500">{mentor.collegename}</p>
                </div>
                {mentor.skills && mentor.skills.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-semibold">Skills</p>
                        <p className="text-sm text-gray-500">{mentor.skills.join(', ')}</p>
                    </div>
                )}
                <div className="mt-4">
                    <p className="text-sm font-semibold">SPI</p>
                    <p className="text-sm text-gray-500">{mentor.spi}</p>
                </div>
                <div className="mt-4">
                    <p className="text-sm font-semibold">Mentor Since</p>
                    <p className="text-sm text-gray-500">{new Date(mentor.appliedAt).toLocaleDateString()}</p>
                </div>
                {mentor.achievements && mentor.achievements.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-semibold">Achievements</p>
                        <ul className="list-disc list-inside text-sm text-gray-500">
                            {mentor.achievements.map((achievement, index) => (
                                <li key={index}>
                                    {achievement.title} - {achievement.description} ({new Date(achievement.date).toLocaleDateString()})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {mentor.internships && mentor.internships.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-semibold">Internships</p>
                        <ul className="list-disc list-inside text-sm text-gray-500">
                            {mentor.internships.map((internship, index) => (
                                <li key={index}>
                                    {internship.company} - {internship.position} ({internship.duration})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="mt-4">
                    <ReactStars
                        count={5}
                        value={stars}
                        onChange={handleRatingChange}
                        edit={true}
                        size={24}
                        activeColor="#ffd700"
                    />
                </div>
            </div>
        </div>
    );
};

export default MentorCard; 