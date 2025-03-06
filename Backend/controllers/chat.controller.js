import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";

// Create a new private chat
export const createChat = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user.id;

    let chat = await Chat.findOne({
      participants: { $all: [userId, recipientId] },
    });

    if (!chat) {
      chat = new Chat({ participants: [userId, recipientId], messages: [] });
      await chat.save();
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: "Error creating chat", error });
  }
};

// Get all chats of a user
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({ participants: userId }).populate(
      "participants"
    );
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chats", error });
  }
};

// Send a message in private chat (uses Socket.io for real-time updates)
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = new Message({ sender: userId, content, chat: chatId });
    await message.save();

    const chat = await Chat.findById(chatId);
    chat.messages.push(message._id);
    await chat.save();

    req.io.to(chatId).emit("newMessage", message); // Emit real-time message using Socket.io

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error });
  }
};
