import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" }, // Null for global announcements
    title: { type: String, required: true },
    content: { type: String, required: true },
    isGlobal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;
