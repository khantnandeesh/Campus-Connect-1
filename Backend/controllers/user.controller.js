import User from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("friends", "username avatar")
      .populate("sentRequests", "username avatar"); // Include sentRequests

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { bio, interest, gender, age, avatar } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    user.bio = bio || user.bio;
    user.interest = interest || user.interest;
    user.gender = gender || user.gender;
    user.age = age || user.age;
    user.avatar = avatar || user.avatar;

    await user.save();
    res.json({ message: "Profile updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const sender = await User.findById(req.user._id);
    const receiver = await User.findById(req.params.id);

    if (!receiver) return res.status(404).json({ message: "User not found" });

    if (
      sender.friends.includes(receiver._id) ||
      receiver.friends.includes(sender._id)
    ) {
      return res.status(400).json({ message: "You are already friends" });
    }

    if (
      sender.sentRequests.includes(receiver._id) ||
      receiver.receivedRequests.includes(sender._id)
    ) {
      return res.status(400).json({ message: "Request already sent" });
    }

    sender.sentRequests.push(receiver._id);
    receiver.receivedRequests.push(sender._id);

    await sender.save();
    await receiver.save();
    // Emit real-time notification
    io.to(users.get(recipientId)).emit(
      "receive-notification",
      "You have a new friend request!"
    );
    res.json({ message: "Friend request sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const receiver = await User.findById(req.user._id);
    const sender = await User.findById(req.params.id);

    if (!sender || !receiver)
      return res.status(404).json({ message: "User not found" });

    if (!receiver.receivedRequests.includes(sender._id)) {
      return res.status(400).json({ message: "No friend request found" });
    }

    receiver.friends.push(sender._id);
    sender.friends.push(receiver._id);

    receiver.receivedRequests = receiver.receivedRequests.filter(
      (reqId) => reqId.toString() !== sender._id.toString()
    );
    sender.sentRequests = sender.sentRequests.filter(
      (reqId) => reqId.toString() !== receiver._id.toString()
    );

    await receiver.save();
    await sender.save();

    res.json({ message: "Friend request accepted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const receiver = await User.findById(req.user._id);
    const sender = await User.findById(req.params.id);

    if (!sender || !receiver)
      return res.status(404).json({ message: "User not found" });

    receiver.receivedRequests = receiver.receivedRequests.filter(
      (reqId) => reqId.toString() !== sender._id.toString()
    );
    sender.sentRequests = sender.sentRequests.filter(
      (reqId) => reqId.toString() !== receiver._id.toString()
    );

    await receiver.save();
    await sender.save();

    res.json({ message: "Friend request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const friend = await User.findById(req.params.id);

    if (!user || !friend)
      return res.status(404).json({ message: "User not found" });

    user.friends = user.friends.filter(
      (friendId) => friendId.toString() !== friend._id.toString()
    );
    friend.friends = friend.friends.filter(
      (friendId) => friendId.toString() !== user._id.toString()
    );

    await user.save();
    await friend.save();

    res.json({ message: "Friend removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user suggestions based on same interest & same college
export const getSuggestedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const excludedUsers = [
      ...user.friends,
      ...user.sentRequests,
      ...user.receivedRequests,
      user._id,
    ];

    const suggestedUsers = await User.find({
      _id: { $nin: excludedUsers }, // Exclude friends & requests
      collegename: user.collegename,
      interest: user.interest,
    }).select("username email collegename interest");

    res.json(suggestedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search users by name (partial match)
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    const users = await User.find({
      username: { $regex: query, $options: "i" }, // Case-insensitive search
      _id: { $ne: req.user._id }, // Exclude the current user
    }).select("id username avatar email collegename interest");

    res.json(users);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

// Get friend requests
export const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("sentRequests", "username email collegename interest")
      .populate("receivedRequests", "username email collegename interest");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      sentRequests: user.sentRequests,
      receivedRequests: user.receivedRequests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user avatar
export const updateAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "avatars" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    user.avatar = result.secure_url;
    await user.save();

    res.json({ message: "Avatar updated", avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "name email avatar"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: error.message });
  }
};

export const searchMentorUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Search for users where email or name contains the query string
    const users = await User.find({
      $or: [
        { email: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } }
      ]
    }).select("name email avatar");

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: error.message });
  }
};