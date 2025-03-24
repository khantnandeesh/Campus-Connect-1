import mongoose from "mongoose";

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ text: String, votes: { type: Number, default: 0 } }], // Multiple-choice options
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    }, // Polls belong to a group
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who have voted
    expiresAt: { type: Date }, // Expiry time for poll
  },
  { timestamps: true }
);

const Poll = mongoose.model("Poll", pollSchema);
export default Poll;
