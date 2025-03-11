import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const MentorChatList = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await axios.get('http://localhost:3000/auth/mentor/chats');
                setChats(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchChats();
    }, []);

    const handleChatClick = async (participantId) => {
        await axios.get('http://localhost:3000/auth/me').then((res) => {
            let userId = res.data._id;
            navigate(`/chat/${userId}/${participantId}`);
        });

        navigate(`/chat/${chatId}/${participantId}`, { state: { participantId } });
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;

    return (
        <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-gray-800 text-white p-4">
                <h2 className="text-xl font-semibold">Chats</h2>
            </div>
            <div className="divide-y divide-gray-200">
                {chats.map((chat) => (
                    <div
                        key={chat._id}
                        onClick={() => handleChatClick(chat._id)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                {/* <h3 className="text-lg font-medium text-gray-900">
                                    {chat.participantName}
                                </h3> */}
                                <p className="text-sm text-gray-500 truncate">
                                    {chat.lastMessage || 'No messages yet'}
                                </p>
                            </div>

                        </div>
                    </div>
                ))}
                {chats.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                        No chats available
                    </div>
                )}
            </div>
        </div>
    );
};

export default MentorChatList; 