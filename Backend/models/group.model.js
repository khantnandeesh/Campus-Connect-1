import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    tags: [{ type: String }], // Interest-based search tags
    collegename: { type: String, required: true }, // College-based filtering
    isPublic: { type: Boolean, default: true }, // If false, group is hidden & invite-only
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
    documents: [{ type: String }], // URLs of documents
    images: [{ type: String }], // URLs of images
    avatar: { type: String }, // URL of group avatar
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);
export default Group;
