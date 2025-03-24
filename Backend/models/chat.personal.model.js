import mongoose from "mongoose";
const chatSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Two users in a private chat
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    documents: [{ type: String }], // URLs of documents
    images: [{ type: String }], // URLs of images
  },
  { timestamps: true }
);

const Chat = mongoose.model("ChatPersonal", chatSchema);
export default Chat;
