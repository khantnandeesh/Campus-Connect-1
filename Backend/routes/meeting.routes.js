import express from "express";
import {
  scheduleMeeting,
  respondToMeeting
} from "../controllers/meeting.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import Meeting from "../models/meeting.model.js";
const router = express.Router();

// Schedule a new meeting
router.post("/schedule", scheduleMeeting);

// Respond to a meeting request
router.post("/:meetingId/respond", respondToMeeting);



router.get("/all", authMiddleware, getAllMeetings);

async   function getAllMeetings(req, res) {
  console.log(req.user);
  
    const userId = req.user._id;
    const meetings = await Meeting.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
        status: "accepted"
    });
    res.status(200).json(meetings);
}

export default router;
