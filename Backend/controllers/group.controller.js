import Group from "../models/group.model.js";
import Message from "../models/message.model.js";
import GroupRequest from "../models/groupRequest.model.js";
import User from "../models/user.model.js";

// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, tags, isPublic } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    const group = new Group({
      name,
      description,
      tags,
      collegename: user.collegename,
      isPublic,
      admins: [userId],
      members: [userId],
    });

    await group.save();
    res.status(201).json({ message: "Group created successfully", group });
  } catch (error) {
    res.status(500).json({ message: "Error creating group", error });
  }
};

// Get groups for the logged-in user's college
export const getGroupsByCollege = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const groups = await Group.find({ collegename: user.collegename });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Error fetching groups", error });
  }
};

// Join a public group
export const joinPublicGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const group = await Group.findById(groupId);

    if (!group.isPublic)
      return res.status(403).json({ message: "This is a private group" });
    if (group.members.includes(userId))
      return res.status(400).json({ message: "Already a member" });

    group.members.push(userId);
    await group.save();
    res.json({ message: "Joined group successfully", group });
  } catch (error) {
    res.status(500).json({ message: "Error joining group", error });
  }
};

// Handle requests for private groups
export const handleGroupRequest = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const group = await Group.findById(groupId);

    if (group.isPublic)
      return res
        .status(400)
        .json({ message: "No request needed for public groups" });

    const existingRequest = await GroupRequest.findOne({
      user: userId,
      group: groupId,
    });
    if (existingRequest)
      return res.status(400).json({ message: "Request already sent" });

    const request = new GroupRequest({ user: userId, group: groupId });
    await request.save();
    res.json({ message: "Join request sent" });
  } catch (error) {
    res.status(500).json({ message: "Error requesting to join", error });
  }
};

// Post an announcement (global or within group)
export const postAnnouncement = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, isGlobal } = req.body;
    const userId = req.user.id;

    const message = new Message({
      sender: userId,
      content,
      group: groupId,
      isGlobal,
    });
    await message.save();
    res.json({ message: "Announcement posted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error posting announcement", error });
  }
};

// Pin a message in a group
export const pinMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { messageId } = req.body;
    const group = await Group.findById(groupId);

    if (!group) return res.status(404).json({ message: "Group not found" });

    group.pinnedMessages.push(messageId);
    await group.save();
    res.json({ message: "Message pinned successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error pinning message", error });
  }
};
