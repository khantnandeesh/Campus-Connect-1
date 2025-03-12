import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, default: "" }, // updated: allow empty content
    mediaUrl: { type: String }, // Cloudinary URL for multimedia
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" }, // If message is part of a group
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, // If message is in private chat
    isGlobal: { type: Boolean, default: false }, // Announcement visible to all users of the same college
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
