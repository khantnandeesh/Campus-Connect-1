import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:3000");
axios.defaults.baseURL = "http://localhost:3000";
axios.defaults.withCredentials = true;

const StudyRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState("");
  const [timer, setTimer] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [duration, setDuration] = useState(25);
  const [mode, setMode] = useState("work");

  // Timer circle visualization
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = ((timer / (duration * 60)) * circumference).toFixed(2);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const res = await axios.get(`/api/rooms/${roomId}`);
        const room = res.data;
        
        // Ensure participants have username
        const validParticipants = room.participants.map(p => ({
          ...p,
          username: p.username || "Anonymous"
        }));
        
        // Ensure messages have sender info
        const validMessages = room.chatMessages.map(msg => ({
          ...msg,
          sender: msg.sender || { username: "Anonymous" }
        }));

        setParticipants(validParticipants);
        setTasks(room.tasks || []);
        setMessages(validMessages);
        setTimer(room.timer?.timeLeft || 25 * 60);
        setIsRunning(room.timer?.isRunning || false);
        setDuration((room.timer?.duration || 25 * 60) / 60);
        setMode(room.timer?.mode || "work");
      } catch (err) {
        console.error("Error fetching room data:", err);
      }
    };

    const fetchTimerState = async () => {
      try {
        const res = await axios.get(`/api/rooms/${roomId}`);
        setTimer(res.data.timer.timeLeft);
        setIsRunning(res.data.timer.isRunning);
        setMode(res.data.timer.mode);
      } catch (err) {
        console.error("Error fetching timer state:", err);
      }
    };

    fetchTimerState();
    socket.emit("joinRoom", roomId);
    fetchRoomData();

    socket.on("newMessage", (msg) => {
      // Ensure new messages have sender info
      const validMsg = {
        ...msg,
        sender: msg.sender || { username: "Anonymous" }
      };
      setMessages(prev => [...prev, validMsg]);
    });

    socket.on("taskAdded", (newTask) => setTasks(prev => [...prev, newTask]));
    socket.on("taskDeleted", (taskId) =>
      setTasks(prev => prev.filter(t => t._id !== taskId))
    );
    socket.on("taskUpdated", (updatedTask) =>
      setTasks(prev => prev.map(t => (t._id === updatedTask._id ? updatedTask : t)))
    );
    socket.on("timerUpdated", (timerData) => {
      setTimer(timerData.timeLeft);
      setIsRunning(timerData.isRunning);
      setDuration(timerData.duration / 60);
      setMode(timerData.mode);
    });
    socket.on("participantsUpdated", (updatedParticipants) =>
      setParticipants(updatedParticipants.map(p => ({
        ...p,
        username: p.username || "Anonymous"
      })))
    );

    return () => {
      socket.emit("leaveRoom", roomId);
      socket.off("newMessage");
      socket.off("taskAdded");
      socket.off("taskDeleted");
      socket.off("taskUpdated");
      socket.off("timerUpdated");
      socket.off("participantsUpdated");
    };
  }, [roomId]);

  const handleDurationChange = (minutes) => {
    if (!isRunning && minutes > 0 && minutes <= 120) {
      setDuration(minutes);
      socket.emit("setDuration", { roomId, duration: minutes * 60, mode });
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      await axios.post(`/api/rooms/${roomId}/chat`, { message });
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const toggleTimer = () => {
    if (isRunning) {
      socket.emit("stopTimer", roomId);
    } else {
      socket.emit("startTimer", roomId);
    }
  };

  const toggleMode = () => {
    const newMode = mode === "work" ? "break" : "work";
    socket.emit("stopTimer", roomId);
    socket.emit("toggleMode", {
      roomId,
      mode: newMode,
      duration: newMode === "work" ? 25 * 60 : 5 * 60
    });
  };

  const addTask = async () => {
    if (!task.trim()) return;
    try {
      await axios.post(`/api/rooms/${roomId}/task`, { title: task });
      setTask("");
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`/api/rooms/${roomId}/task/${taskId}`);
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const toggleTask = async (taskId, completed) => {
    try {
      await axios.post(`/api/rooms/${roomId}/task/${taskId}`, { taskId, completed });
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const leaveRoom = async () => {
    try {
      await axios.post(`/api/rooms/${roomId}/leave`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error leaving room:", err);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-900 min-h-screen text-white">
      <div className="max-w-6xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="w-full bg-gray-700 text-white rounded-lg p-6 flex flex-col items-center">
            <h2 className="text-3xl font-bold">
              {mode === "work" ? "Focus Time" : "Break Time"}
            </h2>
            
            {/* Timer Circle */}
            <div className="relative w-48 h-48 mt-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="80"
                  className="stroke-current text-gray-600"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="80"
                  className={`stroke-current ${mode === 'work' ? 'text-blue-400' : 'text-green-400'}`}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${progress} ${circumference}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-4xl font-mono">
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
                </p>
              </div>
            </div>

            {/* Duration Buttons */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {(mode === "work" ? [25, 30, 45, 60] : [5, 15]).map((min) => (
                <button
                  key={min}
                  onClick={() => handleDurationChange(min)}
                  className={`px-3 py-1 rounded ${
                    duration === min ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'
                  } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isRunning}
                >
                  {min}m
                </button>
              ))}
            </div>

            {/* Control Buttons */}
            <div className="mt-4 flex gap-2">
              <button
                className={`px-4 py-2 rounded ${
                  isRunning ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
                }`}
                onClick={toggleTimer}
              >
                {isRunning ? "Stop" : "Start"}
              </button>
              <button
                className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-500"
                onClick={toggleMode}
              >
                {mode === "work" ? "Break" : "Work"}
              </button>
            </div>
          </div>

          {/* Participants */}
          <div className="mt-6 w-full bg-gray-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-center">Participants</h2>
            {participants.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {participants.map((p, index) => (
                  <li
                    key={p.userId || `participant-${index}`}
                    className="flex items-center gap-2 text-gray-200"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    {p.username}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center mt-2">No participants yet</p>
            )}
          </div>
          <button
            onClick={leaveRoom}
            className="mt-6 text-red-400 hover:text-red-300"
          >
            Leave Room
          </button>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Chat Section */}
          <div className="bg-gray-700 rounded-lg p-6 shadow">
            <h2 className="text-2xl font-semibold mb-4">Chat</h2>
            <div className="border border-gray-600 rounded-md p-4 h-64 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg._id || msg.timestamp}
                  className="mb-3 p-2 rounded-lg bg-gray-800"
                >
                  <p className="text-sm text-blue-300 font-medium">
                    {msg.sender?.username}
                  </p>
                  <p className="text-gray-200">{msg.message}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex">
              <input
                type="text"
                className="w-full bg-gray-800 border border-gray-600 p-3 rounded-l-md focus:outline-none focus:border-blue-400"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                className="bg-blue-600 text-white px-4 rounded-r-md hover:bg-blue-500"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="bg-gray-700 rounded-lg p-6 shadow">
            <h2 className="text-2xl font-semibold mb-4">Tasks</h2>
            <div className="grid grid-cols-1 gap-3">
              {tasks.map((t) => (
                <div
                  key={t._id}
                  className={`p-3 rounded-lg flex justify-between items-center ${
                    t.completed ? 'bg-gray-800' : 'bg-gray-800 border border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggleTask(t._id, t.completed)}
                      className="w-4 h-4 text-blue-400 bg-gray-700 rounded focus:ring-blue-500"
                    />
                    <span className={`${t.completed ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                      {t.title}
                    </span>
                  </div>
                  <button
                    className="text-red-400 hover:text-red-300"
                    onClick={() => deleteTask(t._id)}
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
            <input
              type="text"
              className="w-full bg-gray-800 border border-gray-600 p-3 rounded mt-4 focus:outline-none focus:border-blue-400"
              placeholder="Add a new task..."
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyRoom;