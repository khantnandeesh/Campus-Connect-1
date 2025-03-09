import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRecoilState } from 'recoil';
import { darkModeState } from '../atoms/mentorshipAtoms';
import MentorshipNavbar from './MentorshipNavbar';

const Chat = () => {
    const { mentorId } = useParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isDarkMode] = useRecoilState(darkModeState);
    const [wsConnected, setWsConnected] = useState(false);
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Connect to WebSocket server on port 3001
        ws.current = new WebSocket('ws://localhost:3001');

        ws.current.onopen = () => {
            console.log('Connected to chat server');
            setWsConnected(true);

            // Send join message
            const joinMessage = {
                type: 'join',
                mentorId: mentorId,
                userId: localStorage.getItem('userId')
            };

            try {
                const jsonString = JSON.stringify(joinMessage);
                console.log('Sending join message:', jsonString); // Debug log
                ws.current.send(jsonString);
            } catch (error) {
                console.error('Error sending join message:', error);
            }
        };

        ws.current.onmessage = (event) => {
            try {
                console.log('Received raw message:', event.data); // Debug log
                const data = JSON.parse(event.data);
                console.log('Parsed message:', data); // Debug log

                switch (data.type) {
                    case 'message':
                        setMessages(prev => [...prev, data]);
                        break;
                    case 'system':
                        console.log('System message:', data.content);
                        break;
                    case 'error':
                        console.error('Server error:', data.content);
                        break;
                    default:
                        console.log('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Error handling message:', error);
            }
        };

        ws.current.onclose = () => {
            console.log('Disconnected from chat server');
            setWsConnected(false);
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setWsConnected(false);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [mentorId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !wsConnected || ws.current.readyState !== WebSocket.OPEN) return;

        try {
            const messageData = {
                type: 'message',
                sender: localStorage.getItem('username'),
                content: newMessage.trim(),
                mentorId: mentorId,
                userId: localStorage.getItem('userId')
            };

            const jsonString = JSON.stringify(messageData);
            console.log('Sending message:', jsonString); // Debug log
            ws.current.send(jsonString);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <>
            <MentorshipNavbar isDarkMode={isDarkMode} />
            <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} pt-20 p-4`}>
                <div className="max-w-3xl mx-auto">
                    <div className={`h-[70vh] flex flex-col rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                        <div className="flex-1 overflow-y-auto p-4">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`mb-4 ${message.sender === localStorage.getItem('username') ? 'text-right' : ''}`}
                                >
                                    <div
                                        className={`inline-block rounded-lg px-4 py-2 max-w-xs lg:max-w-md ${message.sender === localStorage.getItem('username')
                                            ? 'bg-green-600 text-white'
                                            : isDarkMode
                                                ? 'bg-gray-700 text-white'
                                                : 'bg-gray-100'
                                            }`}
                                    >
                                        <p className="font-semibold text-sm">{message.sender}</p>
                                        <p>{message.content}</p>
                                        <p className="text-xs opacity-75 mt-1">
                                            {new Date(message.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className={`flex-1 p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}
                                    disabled={!wsConnected}
                                />
                                <button
                                    type="submit"
                                    className={`bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors ${!wsConnected && 'opacity-50 cursor-not-allowed'
                                        }`}
                                    disabled={!wsConnected}
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Chat; 