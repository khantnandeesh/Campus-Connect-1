import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    isGlobal: { type: Boolean, default: false },
    category: {
      type: String,
      enum: [
        "Event Notices",
        "Important Updates",
        "Club & Group Announcements",
        "Achievements & Highlights",
      ],
      required: true,
    },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;
