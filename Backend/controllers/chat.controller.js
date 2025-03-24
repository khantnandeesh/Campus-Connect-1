import Chat from "../models/chat.model.js";

export const getChatHistory = async (req, res) => {
  try {
    const { userId, receiverId } = req.params;

    // Find or create chat between users
    let chat = await Chat.findOne({
      participants: { $all: [userId, receiverId] }
    }).populate("participants", "name email");

    if (!chat) {
      chat = await Chat.create({
        participants: [userId, receiverId],
        messages: []
      });
      chat = await chat.populate("participants", "name email");
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, isMedia } = req.body;

    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [senderId, receiverId],
        messages: []
      });
    }

    const message = {
      sender: senderId,
      content,
      isMedia: isMedia || false,
      timestamp: new Date()
    };

    chat.messages.push(message);
    chat.lastMessage = new Date();
    await chat.save();

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
