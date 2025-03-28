import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import Sender from "./Sender";

const Room = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const createRoom = async () => {
    try {
      const response = await axios.post("/api/rooms/");
      const newRoomId = response.data.roomId;
      console.log("Room created with ID:", newRoomId);
      toast.success("Room created successfully!");
      navigate(`/room/${newRoomId}`);
    } catch (error) {
      console.error("Error creating room:", error.response?.data || error.message);
      toast.error("Error creating room");
    }
  };

  const joinRoom = async () => {
    if (roomId.trim() === "") {
      toast.error("Room ID cannot be empty");
      return;
    }

    try {
      const response = await axios.post(`/api/rooms/${roomId}/join`);
      if (response.status === 200) {
        console.log("Room found. Joining...");
        toast.success("Joined room successfully!");
        navigate(`/room/${roomId}`);
      }
    } catch (error) {
      console.error("Error joining room:", error.response?.data || error.message);
      toast.error("Room not found. Please check the Room ID.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      <Toaster position="top-right" reverseOrder={false} />
      <h1 className="text-5xl font-extrabold mb-8 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
        Virtual Study Room
      </h1>
      <button
        onClick={createRoom}
        className="px-8 py-3 rounded-full shadow-md bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]"
      >
        Create a Room
      </button>
      <div className="mt-8 flex flex-col items-center">
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="p-3 border border-gray-600 rounded-lg w-80 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button
          onClick={joinRoom}
          className="mt-4 px-8 py-3 rounded-full font-bold border-blue-500 text-blue-500 bg-transparent hover:bg-blue-500 hover:text-white transition-transform transform hover:scale-105 drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]"
        >
          Join Room
        </button>
      </div>
   
    </div>
  );
};

export default Room;
