import mongoose from "mongoose";

const studyRoomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
    },
    participants: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            username: String,   
        }
    ],
    lastUpdated: { type: Date, default: Date.now },
    timer: {
        mode: { type: String, enum: ['work', 'break'], default: 'work' },
        duration: { type: Number, default: 25 * 60 }, 
        timeLeft: { type: Number, default: 25 * 60 },
        isRunning: { type: Boolean, default: false },
    },
    chatMessages: [
        {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: String,
        timestamp: { type: Date, default: Date.now },
        },
    ],
    tasks: [
        {
            title: { type: String, required: true },
            createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            completed: { type: Boolean, default: false },
        }
    ] 
});

const StudyRoom = mongoose.model("StudyRoom", studyRoomSchema);
export default StudyRoom;