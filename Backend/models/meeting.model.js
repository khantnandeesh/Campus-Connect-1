import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: "No description provided"
  },
  date: {
    type: Date,
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending"
  },
  responses: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      accepted: {
        type: Boolean,
        required: true
      },
      respondedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
meetingSchema.index({ senderId: 1, receiverId: 1 });
meetingSchema.index({ date: 1 });
meetingSchema.index({ status: 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);

export default Meeting;
