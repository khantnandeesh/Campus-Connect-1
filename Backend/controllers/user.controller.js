import User from "../models/user.model.js";

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

export const searchUsers = async (req, res) => {
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
