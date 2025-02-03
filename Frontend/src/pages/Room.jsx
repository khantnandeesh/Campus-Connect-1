import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Room = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const createRoom = async () => {
    try {
      const response = await axios.post("/api/rooms/");
      const newRoomId = response.data.roomId;
      console.log("Room created with ID:", newRoomId);
      navigate(`/room/${newRoomId}`);
    } catch (error) {
      console.error(
        "Error creating room:",
        error.response?.data || error.message
      );
    }
  };

  const joinRoom = async () => {
    if (roomId.trim() === "") {
      console.error("Room ID cannot be empty");
      return;
    }

    try {
      const response = await axios.post(`/api/rooms/${roomId}/join`);
      if (response.status === 200) {
        console.log("Room found. Joining...");
        navigate(`/room/${roomId}`);
      }
    } catch (error) {
      console.error("Error joining room:", error.response?.data || error.message);
      alert("Room not found. Please check the Room ID.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-extrabold mb-6 text-gray-100">Virtual Study Room</h1>

      <button
        onClick={createRoom}
        className="px-6 py-3 rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-transform transform hover:scale-105"
      >
        Create a Room
      </button>

      <div className="mt-6 flex flex-col items-center">
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="p-3 border border-gray-600 rounded-lg w-72 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={joinRoom}
          className="mt-4 px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105"
        >
          Join Room
        </button>
      </div>
    </div>
  );
};

export default Room;
