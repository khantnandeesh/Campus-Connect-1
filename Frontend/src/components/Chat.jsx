import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useRecoilValue } from 'recoil';
import { userState } from '../atoms/userAtoms';
import { onlineStatusState } from '../atoms/onlineStatusAtom';

const Chat = () => {
    const { userId } = useParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recipient, setRecipient] = useState(null);
    const messagesEndRef = useRef(null);
    const user = useRecoilValue(userState);
    const onlineStatus = useRecoilValue(onlineStatusState);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/chat/messages/${userId}`, {
                    withCredentials: true
                });
                setMessages(response.data.messages || []);

                // Get recipient details
                const userResponse = await axios.get(`http://localhost:3000/auth/user/${userId}`, {
                    withCredentials: true
                });
                setRecipient(userResponse.data);

                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch messages');
                setLoading(false);
            }
        };

        fetchMessages();
    }, [userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const response = await axios.post('http://localhost:3000/chat/message', {
                recipientId: userId,
                content: newMessage
            }, {
                withCredentials: true
            });

            setMessages([...messages, response.data.messages[response.data.messages.length - 1]]);
            setNewMessage('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send message');
        }
    };

    if (loading) return <div className="text-center p-4">Loading...</div>;
    if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-4rem)]">
            <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${onlineStatus.users.includes(userId) || onlineStatus.mentors.includes(userId)
                        ? 'bg-green-500'
                        : 'bg-red-500'
                        }`} />
                    <h2 className="text-xl font-semibold">
                        {recipient?.username || 'Chat'}
                    </h2>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.senderId === user._id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg p-3 ${message.senderId === user._id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100'
                                    }`}
                            >
                                <p>{message.content}</p>
                                <p className="text-xs mt-1 opacity-70">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex space-x-4">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Chat; 