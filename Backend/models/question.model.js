import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: [{ type: String }],
    category: {
      type: String,
      enum: [
        "Problem Discussions",
        "Interview Experiences",
        "General Discussions",
      ],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Answer" }],
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

questionSchema.index({ tags: 1, category: 1 }); // For efficient tag-based and category search

const Question = mongoose.model("Question", questionSchema);
export default Question;
