import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  ],
  messages: [
    {
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      type: {
        type: String,
        enum: ["text", "image", "video", "audio"],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;

// Method to find all chat participants for a given user ID
chatSchema.statics.findAllParticipants = async function (userId) {
  try {
    // Find all chats where userId is a participant
    const chats = await this.find({
      participants: { $in: [userId] }
    }).sort({ "messages.timestamp": -1 });

    // Create map of participant IDs to their latest message
    const participantMap = new Map();

    chats.forEach((chat) => {
      const otherParticipant = chat.participants.find(
        (p) => p.toString() !== userId.toString()
      );

      if (!participantMap.has(otherParticipant.toString())) {
        const lastMessage = chat.messages
          .filter((m) => m.type === "text")
          .sort((a, b) => b.timestamp - a.timestamp)[0];

        participantMap.set(otherParticipant.toString(), {
          _id: otherParticipant,
          message: lastMessage ? lastMessage.content : ""
        });
      }
    });

    return Array.from(participantMap.values());

    /* Sample output:
    [
      {
        _id: "507f1f77bcf86cd799439011", // MongoDB ObjectId of other participant
        message: "Hey, how are you?" // Their latest message text
      },
      {
        _id: "507f1f77bcf86cd799439012",
        message: "When is the next meeting?"
      },
      {
        _id: "507f1f77bcf86cd799439013", 
        message: "" // Empty string if no messages exist
      }
    ]
    */
  } catch (error) {
    throw error;
  }
};
