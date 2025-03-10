import React, { useEffect, useState, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { chatState } from '../atoms/chatAtoms';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ChatComponent.css';

const ChatComponent = () => {
    const [messages, setMessages] = useRecoilState(chatState);
    const [ws, setWs] = useState(null);
    const [input, setInput] = useState('');
    const [userId, setUserId] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { mentorId } = location.state;
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Fetch user ID from dashboard endpoint
        axios.get("http://localhost:3000/auth/dashboard", {
            withCredentials: true,
        }).then((response) => {
            setUserId(response.data.user.id);
            initializeWebSocket(response.data.user.id);
        }).catch((error) => {
            console.error('Error fetching user data:', error);
            navigate('/login');
        });

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const initializeWebSocket = (currentUserId) => {
        const socket = new WebSocket('ws://localhost:3001');
        setWs(socket);

        socket.onopen = () => {
            console.log('WebSocket Connected');
            const joinMessage = {
                type: 'join',
                userId: currentUserId,
                mentorId: mentorId
            };
            socket.send(JSON.stringify(joinMessage));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            if (data.type === 'previous_messages') {
                setMessages(data.messages);
            } else if (data.type === 'chat') {
                setMessages(prev => [...prev, data.message]);
            } else if (data.type === 'error') {
                console.error('WebSocket error:', data.message);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected');
        };
    };

    const sendMessage = () => {
        if (!ws || ws.readyState !== WebSocket.OPEN || !input.trim() || !userId) {
            return;
        }

        const message = {
            type: 'chat',
            message: input.trim(),
            messageType: 'text'
        };

        ws.send(JSON.stringify(message));
        setInput('');
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || !ws || ws.readyState !== WebSocket.OPEN || !userId) return;

        try {
            const formData = new FormData();
            formData.append('image', file);

            // You'll need to implement this endpoint in your backend
            const response = await axios.post('http://localhost:3000/api/upload', formData);

            const message = {
                type: 'chat',
                message: response.data.imageUrl,
                messageType: 'image'
            };

            ws.send(JSON.stringify(message));
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    if (!userId) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="chat-container">
            <div className="messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.userId === userId ? 'sent' : 'received'}`}>
                        {msg.messageType === 'text' ? (
                            <p>{msg.message}</p>
                        ) : (
                            <img src={msg.imageUrl} alt="Shared" className="chat-image" />
                        )}
                        <span className="timestamp">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="input-container">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message"
                    className="chat-input"
                />
                <button onClick={sendMessage} className="send-button">Send</button>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                    id="image-upload"
                />
                <label htmlFor="image-upload" className="file-input-label">
                    📎
                </label>
            </div>
        </div>
    );
};

export default ChatComponent; 