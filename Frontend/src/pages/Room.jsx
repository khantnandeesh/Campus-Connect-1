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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Virtual Study Room</h1>

      <button
        onClick={createRoom}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
      >
        Create a Room
      </button>

      <div className="mt-6">
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="p-3 border rounded-lg w-64"
        />
        <button
          onClick={joinRoom}
          className="ml-3 px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          Join Room
        </button>
      </div>
    </div>
  );
};

export default Room;
