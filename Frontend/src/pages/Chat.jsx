import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { uploadToCloudinary } from '../config/cloudinary';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiPaperclip, FiArrowLeft, FiMic, FiSquare, FiPlay, FiPause, FiCalendar, FiX } from 'react-icons/fi';
import { format } from 'date-fns';

const ApprovedMeetings = ({ meetings }) => {
    if (!meetings || meetings.length === 0) return null;

    return (
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Upcoming Meetings</h3>
            <div className="space-y-2">
                {meetings.map((meeting) => (
                    <div key={meeting._id} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                        <div>
                            <p className="font-medium text-blue-800">{meeting.title}</p>
                            <p className="text-sm text-gray-600">
                                {format(new Date(`${meeting.date}T${meeting.time}`), 'MMM dd, yyyy - h:mm a')}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Chat = () => {
    const { userId, receiverId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [userAvatars, setUserAvatars] = useState({});
    const [userNames, setUserNames] = useState({});
    const [userEmails, setUserEmails] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [receiverStatus, setReceiverStatus] = useState(false);
    const fileInputRef = useRef(null);
    const wsRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const typingTimeoutRef = useRef(null);
    const debounceTimeoutRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingIntervalRef = useRef(null);
    const [playingAudio, setPlayingAudio] = useState(null);
    const audioRefs = useRef({});
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [meetingDetails, setMeetingDetails] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
    });
    const [pendingMeetings, setPendingMeetings] = useState([]);
    const [approvedMeetings, setApprovedMeetings] = useState([]);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        console.log('Selected file:', file);
        setIsUploading(true);
        try {
            console.log('Starting file upload...');
            const fileUrl = await uploadToCloudinary(file);
            console.log('File uploaded successfully, URL:', fileUrl);

            if (!fileUrl) {
                throw new Error('No URL returned from upload');
            }

            const messageContent = file.type.startsWith('image/')
                ? `<img src="${fileUrl}" alt="Shared image" class="max-w-full rounded-lg" style="max-height: 300px; object-fit: contain;" />`
                : `<video src="${fileUrl}" controls class="max-w-full rounded-lg" style="max-height: 300px;"></video>`;

            console.log('Message content:', messageContent);

            // Add message to local state immediately
            setMessages(prev => [...prev, {
                sender: userId,
                content: messageContent,
                timestamp: new Date(),
                isMedia: true
            }]);

            // Send message through WebSocket
            wsRef.current.send(JSON.stringify({
                type: 'message',
                sender: userId,
                receiver: receiverId,
                content: messageContent,
                isMedia: true
            }));

            // Save to database
            await axios.post('/api/chat/send', {
                senderId: userId,
                receiverId: receiverId,
                content: messageContent,
                isMedia: true
            });
        } catch (error) {
            console.error('Error handling file upload:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    useEffect(() => {
        // Fetch user details and chat history
        const fetchData = async () => {
            try {
                // Fetch user details
                const [senderResponse, receiverResponse] = await Promise.all([
                    axios.get(`/api/users/${userId}`),
                    axios.get(`/api/users/${receiverId}`)
                ]);

                // Create avatar URLs with proper fallbacks
                const createAvatarUrl = (user) => {
                    if (user.avatar) {
                        return user.avatar;
                    }
                    const displayName = user.name || user.username || 'User';
                    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                };

                setUserAvatars({
                    [userId]: createAvatarUrl(senderResponse.data),
                    [receiverId]: createAvatarUrl(receiverResponse.data)
                });

                setUserNames({
                    [userId]: senderResponse.data.name || senderResponse.data.username || 'User',
                    [receiverId]: receiverResponse.data.name || receiverResponse.data.username || 'User'
                });

                setUserEmails({
                    [userId]: senderResponse.data.email,
                    [receiverId]: receiverResponse.data.email
                });

                // Fetch chat history
                const chatResponse = await axios.get(`/api/chat/${userId}/${receiverId}`);
                const processedMessages = chatResponse.data.messages.map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp),
                    isMedia: msg.isMedia || false,
                    content: msg.isMedia ? msg.content : msg.content
                }));
                setMessages(processedMessages || []);

                // Fetch approved meetings between these users
                const meetingsResponse = await axios.get(`/api/meetings/${userId}`);
                const relevantMeetings = meetingsResponse.data.meetings.filter(meeting =>
                    meeting.status === 'accepted' &&
                    ((meeting.senderId === userId && meeting.receiverId === receiverId) ||
                        (meeting.senderId === receiverId && meeting.receiverId === userId))
                );

                // Sort meetings by date and time
                const sortedMeetings = relevantMeetings.sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.time}`);
                    const dateB = new Date(`${b.date}T${b.time}`);
                    return dateA - dateB;
                });

                // Only show future meetings
                const now = new Date();
                const upcomingMeetings = sortedMeetings.filter(meeting => {
                    const meetingDate = new Date(`${meeting.date}T${meeting.time}`);
                    return meetingDate > now;
                });

                setApprovedMeetings(upcomingMeetings);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();

        // Connect to WebSocket
        const ws = new WebSocket('ws://localhost:3001');
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected'); // Debug log
            // Join chat with user ID
            ws.send(JSON.stringify({
                type: 'join',
                userId: userId,
                receiverId: receiverId
            }));
            setIsOnline(true);
            setReceiverStatus(true); // Set receiver as online when we connect
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected'); // Debug log
            setIsOnline(false);
            setReceiverStatus(false);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);

            switch (data.type) {
                case 'message':
                    if (data.sender !== userId) {
                        setMessages(prev => [...prev, {
                            sender: data.sender,
                            content: data.content,
                            timestamp: new Date(data.timestamp),
                            isMedia: data.isMedia
                        }]);
                    }
                    break;

                case 'meeting_request':
                    if (data.sender !== userId) {
                        console.log('Received meeting request:', data);
                        const messageContent = `
                            <div class="meeting-request-container p-4 sm:p-6 bg-gradient-to-r from-blue-950 to-indigo-950 rounded-lg border border-blue-800 shadow-lg text-sm w-full max-w-2xl mx-auto">
    <div class="space-y-4">
        <div class="flex items-center space-x-3">
            <svg class="w-5 h-5 sm:w-6 sm:h-6 text-blue-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 class="font-semibold text-base sm:text-lg text-blue-100 break-words">${data.title}</h3>
        </div>
        
        <p class="text-sm text-blue-200 leading-relaxed border-l-4 border-blue-500 pl-3 sm:pl-4 pr-2 break-words">
            ${data.description || 'No description provided'}
        </p>
        
        <div class="flex items-center text-xs sm:text-sm text-blue-200 bg-blue-900/50 px-3 sm:px-4 py-2 sm:py-3 rounded-md">
            <svg class="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="break-words">${new Date(data.date + ' ' + data.time).toLocaleString([], {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</span>
        </div>
        
        <div class="flex flex-col  items-center gap-2 sm:gap-4 mt-4 pt-4 border-t border-blue-900">
            <button
                onclick="window.handleMeetingResponse('${data.meetingId}', true)"
                class="w-full px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-md text-sm font-medium
                    transition-all duration-200 ease-in-out hover:bg-blue-400
                    hover:shadow-lg active:transform active:scale-95"
            >
                Accept Meeting
            </button>
            <button
                onclick="window.handleMeetingResponse('${data.meetingId}', false)"
                class="w-full px-4 sm:px-6 py-2 sm:py-3 bg-blue-950 text-blue-200 border border-blue-800 rounded-md
                    text-sm font-medium transition-all duration-200 ease-in-out
                    hover:bg-blue-900 hover:border-blue-700 active:transform active:scale-95"
            >
                Decline
            </button>
        </div>
    </div>
</div>
                        `;

                        setMessages(prev => [...prev, {
                            sender: data.sender,
                            content: messageContent,
                            timestamp: new Date(),
                            isMedia: true
                        }]);
                    }
                    break;

                case 'meeting_response':
                    console.log('Received meeting response:', data);
                    const messageContent = `
                        <div class="meeting-response-container p-3   ${data.accepted ? 'bg-gray-700' : 'bg-red-400'} rounded-lg pr-10">
                            <p class="text-sm text-blue-600">
                                ${data.accepted ? 'Meeting accepted! 🎉' : 'Meeting declined'}
                            </p>
                        </div>
                    `;

                    setMessages(prev => [...prev, {
                        sender: data.sender,
                        content: messageContent,
                        timestamp: new Date(),
                        isMedia: true
                    }]);
                    break;

                case 'typing':
                    console.log('Typing status received:', data);
                    if (data.userId === receiverId) {
                        setIsTyping(data.isTyping);
                        // Clear existing timeout
                        if (typingTimeoutRef.current) {
                            clearTimeout(typingTimeoutRef.current);
                        }
                        // Set new timeout to clear typing status after 3 seconds of no typing
                        if (data.isTyping) {
                            typingTimeoutRef.current = setTimeout(() => {
                                console.log('Clearing typing status after timeout');
                                setIsTyping(false);
                            }, 3000);
                        }
                    }
                    break;

                case 'status':
                    console.log('Status update received:', data);
                    if (data.userId === receiverId) {
                        setReceiverStatus(data.isOnline);
                    }
                    break;
            }
        };

        // Set up heartbeat to maintain connection and check status
        const heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'heartbeat',
                    userId: userId,
                    receiverId: receiverId
                }));
            }
        }, 5000); // Send heartbeat every 5 seconds

        // Add global function for meeting response
        window.handleMeetingResponse = async (meetingId, accepted) => {
            try {
                await axios.post(`/api/meetings/${meetingId}/respond`, {
                    userId,
                    accepted
                });

                // Send response through WebSocket
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'meeting_response',
                        sender: userId,
                        receiver: receiverId,
                        meetingId,
                        accepted
                    }));
                }
            } catch (error) {
                console.error('Error responding to meeting:', error);
                alert('Failed to respond to meeting request. Please try again.');
            }
        };

        return () => {
            clearInterval(heartbeatInterval);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            ws.close();
            delete window.handleMeetingResponse;
        };
    }, [userId, receiverId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            // Add message to local state immediately
            setMessages(prev => [...prev, {
                sender: userId,
                content: newMessage,
                timestamp: new Date(),
                isMedia: false
            }]);

            // Send message through WebSocket
            wsRef.current.send(JSON.stringify({
                type: 'message',
                sender: userId,
                receiver: receiverId,
                content: newMessage,
                isMedia: false
            }));

            // Save to database
            await axios.post('/api/chat/send', {
                senderId: userId,
                receiverId: receiverId,
                content: newMessage,
                isMedia: false
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Handle typing indicator with debounce
    const handleTyping = () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        // Clear existing debounce timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Send typing status immediately
        console.log('Sending typing status:', { userId, receiverId, isTyping: true });
        wsRef.current.send(JSON.stringify({
            type: 'typing',
            userId: userId,
            receiverId: receiverId,
            isTyping: true
        }));

        // Set a new debounce timeout
        debounceTimeoutRef.current = setTimeout(() => {
            console.log('Sending typing stopped status:', { userId, receiverId, isTyping: false });
            wsRef.current.send(JSON.stringify({
                type: 'typing',
                userId: userId,
                receiverId: receiverId,
                isTyping: false
            }));
        }, 1000);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await handleAudioUpload(audioBlob);
                audioChunksRef.current = [];
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Start timer
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            clearInterval(recordingIntervalRef.current);
        }
    };

    const handleAudioUpload = async (audioBlob) => {
        setIsUploading(true);
        try {
            const audioFile = new File([audioBlob], 'audio-message.webm', { type: 'audio/webm' });
            const fileUrl = await uploadToCloudinary(audioFile);

            if (!fileUrl) {
                throw new Error('No URL returned from upload');
            }

            // Create a simpler audio player with custom controls
            const messageContent = `
                <div class="audio-player-container flex items-center space-x-2">
                    <button 
                        class="play-pause-btn p-2 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                        onclick="window.handleAudioPlayPause('${fileUrl}', this)"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    <div class="flex-1">
                        <div class="text-sm">Audio message</div>
                        <div class="text-xs text-gray-400">Tap to play</div>
                    </div>
                </div>
            `;

            // Add message to local state immediately
            setMessages(prev => [...prev, {
                sender: userId,
                content: messageContent,
                timestamp: new Date(),
                isMedia: true
            }]);

            // Send message through WebSocket
            wsRef.current.send(JSON.stringify({
                type: 'message',
                sender: userId,
                receiver: receiverId,
                content: messageContent,
                isMedia: true
            }));

            // Save to database
            await axios.post('/api/chat/send', {
                senderId: userId,
                receiverId: receiverId,
                content: messageContent,
                isMedia: true
            });
        } catch (error) {
            console.error('Error handling audio upload:', error);
            alert('Failed to upload audio. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    // Add this new function to handle audio playback
    useEffect(() => {
        // Add global function for audio playback
        window.handleAudioPlayPause = (audioUrl, button) => {
            const audio = audioRefs.current[audioUrl];
            if (!audio) {
                // Create new audio element if it doesn't exist
                const newAudio = new Audio(audioUrl);
                newAudio.onended = () => {
                    button.innerHTML = `
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    `;
                };
                audioRefs.current[audioUrl] = newAudio;
            }

            if (audio.paused) {
                // Stop any currently playing audio
                Object.values(audioRefs.current).forEach(a => {
                    if (a !== audio && !a.paused) {
                        a.pause();
                        a.currentTime = 0;
                    }
                });
                audio.play();
                button.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                `;
            } else {
                audio.pause();
                button.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                `;
            }
        };

        return () => {
            // Cleanup audio elements when component unmounts
            Object.values(audioRefs.current).forEach(audio => {
                audio.pause();
                audio.src = '';
            });
            delete window.handleAudioPlayPause;
        };
    }, []);

    // Add this function to handle meeting scheduling
    const handleScheduleMeeting = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/meetings/schedule', {
                senderId: userId,
                receiverId: receiverId,
                ...meetingDetails,
            });

            const meeting = response.data.meeting;

            // Send meeting request through WebSocket immediately
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                console.log('Sending meeting request through WebSocket');
                wsRef.current.send(JSON.stringify({
                    type: 'meeting_request',
                    sender: userId,
                    receiver: receiverId,
                    meetingId: meeting._id,
                    ...meetingDetails
                }));
            } else {
                console.error('WebSocket is not connected');
            }

            // Add to messages
            const messageContent = `
               <div class="meeting-request-container p-3 sm:p-4 bg-gray-800 rounded-lg shadow-md max-w-md w-full mx-auto">
    <h3 class="font-semibold text-white text-base sm:text-lg mb-2 break-words">${meetingDetails.title}</h3>
    <p class="text-gray-200 text-sm mb-3 break-words">${meetingDetails.description || 'No description provided'}</p>
    <p class="text-gray-400 text-xs sm:text-sm mb-2">
        ${new Date(meetingDetails.date + ' ' + meetingDetails.time).toLocaleString()}
    </p>
    <div class="text-xs sm:text-sm text-blue-400 font-medium">Meeting request sent</div>
</div>
            `;

            setMessages(prev => [...prev, {
                sender: userId,
                content: messageContent,
                timestamp: new Date(),
                isMedia: true
            }]);

            setShowMeetingModal(false);
            setMeetingDetails({
                title: '',
                description: '',
                date: '',
                time: '',
            });
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            alert('Failed to schedule meeting. Please try again.');
        }
    };

    return (
        <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header */}
            <div className={`flex items-center p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                    onClick={() => navigate(`/find-users/${userId}`)}
                    className="mr-4 p-2 hover:bg-gray-700 rounded-full transition-colors"
                >
                    <FiArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <img
                            src={userAvatars[receiverId]}
                            alt={userNames[receiverId]}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userNames[receiverId])}&background=random`;
                            }}
                        />
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isDarkMode ? 'border-gray-900' : 'border-white'} ${receiverStatus ? 'bg-green-500' : 'bg-gray-500'}`} />
                    </div>
                    <div>
                        <h2 className="font-semibold">{userNames[receiverId]}</h2>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {userEmails[receiverId]}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${isTyping ? 'text-blue-500 font-medium' : ''}`}>
                            {isTyping ? 'Typing...' : receiverStatus ? 'Online' : 'Offline'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowMeetingModal(true)}
                    className="ml-auto p-2 hover:bg-gray-700 rounded-full transition-colors"
                >
                    <FiCalendar className="w-6 h-6" />
                </button>
            </div>

            {/* Approved Meetings Section */}
            <ApprovedMeetings meetings={approvedMeetings} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {messages.map((message, index) => (
                        <motion.div
                            key={`${message.sender}-${message.timestamp}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`flex items-start space-x-2 ${message.sender === userId ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
                        >
                            <div className="flex-shrink-0">
                                <img
                                    src={userAvatars[message.sender]}
                                    alt={userNames[message.sender]}
                                    className="w-8 h-8 rounded-full object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userNames[message.sender])}&background=random`;
                                    }}
                                />
                            </div>
                            <div
                                className={`max-w-[70%] rounded-2xl p-3 ${message.sender === userId
                                    ? isDarkMode
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-500 text-white'
                                    : isDarkMode
                                        ? 'bg-gray-800 text-white'
                                        : 'bg-white text-gray-800'
                                    }`}
                            >
                                {message.isMedia ? (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: message.content }}
                                        className="max-w-full rounded-lg overflow-hidden"
                                        style={{
                                            maxWidth: message.content.includes('audio-player-container') ? '300px' : '70%'
                                        }}
                                    />
                                ) : (
                                    <p className="break-words">{message.content}</p>
                                )}
                                <span className={`text-xs mt-1 block ${message.sender === userId ? 'text-blue-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Meeting Schedule Modal */}
            <AnimatePresence>
                {showMeetingModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className={`w-full max-w-lg p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Schedule Meeting</h2>
                                <button
                                    onClick={() => setShowMeetingModal(false)}
                                    className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>
                            <form onSubmit={handleScheduleMeeting} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={meetingDetails.title}
                                        onChange={(e) => setMeetingDetails(prev => ({
                                            ...prev,
                                            title: e.target.value
                                        }))}
                                        className={`w-full p-2 rounded-lg ${isDarkMode
                                            ? 'bg-gray-700 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                            }`}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={meetingDetails.description}
                                        onChange={(e) => setMeetingDetails(prev => ({
                                            ...prev,
                                            description: e.target.value
                                        }))}
                                        className={`w-full p-2 rounded-lg ${isDarkMode
                                            ? 'bg-gray-700 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                            }`}
                                        rows="3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={meetingDetails.date}
                                            onChange={(e) => setMeetingDetails(prev => ({
                                                ...prev,
                                                date: e.target.value
                                            }))}
                                            className={`w-full p-2 rounded-lg ${isDarkMode
                                                ? 'bg-gray-700 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                                }`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Time</label>
                                        <input
                                            type="time"
                                            value={meetingDetails.time}
                                            onChange={(e) => setMeetingDetails(prev => ({
                                                ...prev,
                                                time: e.target.value
                                            }))}
                                            className={`w-full p-2 rounded-lg ${isDarkMode
                                                ? 'bg-gray-700 text-white'
                                                : 'bg-gray-100 text-gray-900'
                                                }`}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowMeetingModal(false)}
                                        className={`px-4 py-2 rounded-lg ${isDarkMode
                                            ? 'bg-gray-700 hover:bg-gray-600'
                                            : 'bg-gray-200 hover:bg-gray-300'
                                            }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                    >
                                        Schedule
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        placeholder="Type a message..."
                        className={`flex-1 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                            ? 'bg-gray-700 text-white placeholder-gray-400'
                            : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                            }`}
                        disabled={isRecording}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,video/*"
                        className="hidden"
                    />
                    <motion.button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isRecording}
                        className={`p-3 rounded-full ${isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-gray-100 hover:bg-gray-200'
                            } transition-colors ${(isUploading || isRecording) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FiPaperclip className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                        type="button"
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording}
                        disabled={isUploading}
                        className={`p-3 rounded-full ${isRecording
                            ? 'bg-red-500 hover:bg-red-600'
                            : isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200'
                            } transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isRecording ? (
                            <div className="flex items-center space-x-2">
                                <FiSquare className="w-5 h-5" />
                                <span className="text-sm">{recordingTime}s</span>
                            </div>
                        ) : (
                            <FiMic className="w-5 h-5" />
                        )}
                    </motion.button>
                    <motion.button
                        type="submit"
                        disabled={!newMessage.trim() || isUploading || isRecording}
                        className={`p-3 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors ${(!newMessage.trim() || isUploading || isRecording) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <FiSend className="w-5 h-5" />
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

export default Chat;