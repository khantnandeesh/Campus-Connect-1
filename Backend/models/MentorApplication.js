import mongoose from "mongoose";

const mentorApplicationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  college: {
    type: String,
    required: true
  },
  skills: [
    {
      type: String,
      required: true
    }
  ],
  achievements: [
    {
      title: String,
      description: String,
      date: Date
    }
  ],
  internships: [
    {
      company: String,
      position: String,
      duration: String,
      description: String
    }
  ],
  spi: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("MentorApplication", mentorApplicationSchema);
