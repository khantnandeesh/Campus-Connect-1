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

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const res = await axios.get(`/api/rooms/${roomId}`);
        const room = res.data;
        setParticipants(room.participants || []);
        setTasks(room.tasks || []);
        setMessages(room.chatMessages || []);
        setTimer(room.timer?.timeLeft || 25 * 60);
        setIsRunning(room.timer?.isRunning || false);
        setDuration((room.timer?.duration || 25 * 60) / 60);
      } catch (err) {
        console.error("Error fetching room data:", err);
      }
    };

    const fetchTimerState = async () => {
      try {
        const res = await axios.get(`/api/rooms/${roomId}`);
        setTimer(res.data.timer.timeLeft);
        setIsRunning(res.data.timer.isRunning);
      } catch (err) {
        console.error("Error fetching timer state:", err);
      }
    };

    fetchTimerState();
    socket.emit("joinRoom", roomId);
    fetchRoomData();

    socket.on("newMessage", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("taskAdded", (newTask) => setTasks((prev) => [...prev, newTask]));
    socket.on("taskDeleted", (taskId) =>
      setTasks((prev) => prev.filter((t) => t._id !== taskId))
    );
    socket.on("taskUpdated", (updatedTask) =>
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)))
    );
    socket.on("timerUpdated", (timerData) => {
      setTimer(timerData.timeLeft);
      setIsRunning(timerData.isRunning);
      setDuration(timerData.duration / 60);
    });
    socket.on("participantsUpdated", (updatedParticipants) =>
      setParticipants(updatedParticipants)
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
      socket.emit("setDuration", { roomId, duration: minutes * 60 });
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
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col items-center">
          <div className="w-full bg-blue-500 text-white rounded-lg p-6 flex flex-col items-center">
            <h2 className="text-3xl font-bold">Timer</h2>
            <p className="mt-4 text-5xl">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
            </p>
            
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[25, 30, 45, 60].map((min) => (
                <button
                  key={min}
                  onClick={() => handleDurationChange(min)}
                  className={`px-3 py-1 rounded ${
                    duration === min ? "bg-blue-700" : "bg-blue-600 hover:bg-blue-700"
                  } ${isRunning ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={isRunning}
                >
                  {min}m
                </button>
              ))}
            </div>

            <button
              className="mt-4 bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
              onClick={toggleTimer}
            >
              {isRunning ? "Stop Timer" : "Start Timer"}
            </button>
          </div>

          <div className="mt-6 w-full bg-green-100 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-center">Participants</h2>
            {participants.length > 0 ? (
              <ul className="mt-3">
                {participants.map((p, index) => (
                  <li
                    key={p.userId || `participant-${index}`}
                    className="text-gray-800"
                  >
                    {p.username}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-center mt-2">No participants yet</p>
            )}
          </div>
          <button
            onClick={leaveRoom}
            className="mt-6 text-red-500 hover:text-red-700"
          >
            Leave Room
          </button>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-gray-50 rounded-lg p-6 shadow">
            <h2 className="text-2xl font-semibold mb-4">Chat</h2>
            <div className="border rounded-md p-4 h-64 overflow-y-auto">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <p
                    key={msg._id || msg.timestamp}
                    className="mb-2 text-gray-700"
                  >
                    <span className="font-semibold">
                      {msg.sender?.username || "Anonymous"}:{" "}
                    </span>
                    {msg.message}
                  </p>
                ))
              ) : (
                <p className="text-gray-600">No messages yet.</p>
              )}
            </div>
            <div className="mt-4 flex">
              <input
                type="text"
                className="w-full border p-3 rounded-l-md focus:outline-none"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                className="bg-blue-500 text-white px-4 rounded-r-md hover:bg-blue-600"
                onClick={sendMessage}
              >
                Send
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 shadow">
            <h2 className="text-2xl font-semibold mb-4">Tasks</h2>
            <div className="grid grid-cols-1 gap-4">
              {tasks.length > 0 ? (
                tasks.map((t) => (
                  <div
                    key={t._id}
                    className={`border rounded-lg p-4 flex justify-between items-center shadow ${
                      t.completed
                        ? "bg-green-100 line-through text-gray-500"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => toggleTask(t._id, t.completed)}
                        className="mr-2"
                      />
                      <span>{t.title}</span>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteTask(t._id)}
                    >
                      ❌
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No tasks available.</p>
              )}
            </div>
            <input
              type="text"
              className="w-full border p-3 rounded mt-4"
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