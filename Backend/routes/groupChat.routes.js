import express from "express";
import {
  createGroup,
  getGroupsByCollege,
  getUserGroups, // new: get user groups
  searchPublicGroups, // new: search public groups
  joinPublicGroup,
  handleGroupRequest,
  postAnnouncement,
  pinMessage,
  deleteGroup, // new: delete group
  addMemberToGroup, // new: add member
  promoteMember, // new: promote member to admin
  demoteMember, // new: demote admin to member
  sendGroupMessage, // new: send message in group chat
  deleteGroupMessage, // new: delete message in group chat
  sendGroupDocument, // new: send document in group chat
  sendGroupImage, // new: send image in group chat
  getGroupChats, // new: get group chats
  getGroupDetails, // Import the new controller function
  removeMemberFromGroup, // Import the new controller function
  leaveGroup, // new: leave group
  editGroupDetails, // new: edit group details
  updateGroupAvatar, // new: update group avatar
  joinGroup,
  unpinMessage, // new: unpin message
  getPinnedMessages, // new: get pinned messages
  createPoll, // new: create poll
  votePoll, // new: vote poll
  getGroupPolls, // new: get group polls
} from "../controllers/group.controller.js";
import protectRoute from "../middlewares/protectRoute.js";
import { uploadMiddleware } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup); // Create a new group
router.get("/", protectRoute, getGroupsByCollege); // Get groups by college
router.get("/user", protectRoute, getUserGroups); // Get groups for the logged-in user
router.get("/search", protectRoute, searchPublicGroups); // Search public groups by name and tags
router.delete("/:groupId", protectRoute, deleteGroup); // Delete a group
router.post("/join/:groupId", protectRoute, joinPublicGroup); // Join a public group
router.post("/join/:groupId", protectRoute, joinGroup); // Add this new route
router.post("/add-member/:groupId", protectRoute, addMemberToGroup); // Add member to group (by admin)
router.post("/promote/:groupId", protectRoute, promoteMember); // Promote member to admin
router.post("/demote/:groupId", protectRoute, demoteMember); // Demote admin to member
router.post("/request/:groupId", protectRoute, handleGroupRequest); // Request to join a private group
router.post("/announcement/:groupId", protectRoute, postAnnouncement); // Post group/global announcement
router.post("/pin/:groupId", protectRoute, pinMessage); // Pin a message in a group
router.get("/chats/:groupId", protectRoute, getGroupChats); // Fetch group chats
router.get("/details/:groupId", protectRoute, getGroupDetails); // Add route for getting group details
router.post(
  "/remove-member/:groupId/:memberId",
  protectRoute,
  removeMemberFromGroup
); // Remove member from group (by admin)
router.post("/leave/:groupId", protectRoute, leaveGroup); // Leave a group
router.put("/edit/:groupId", protectRoute, editGroupDetails); // Regular group updates
router.put(
  "/avatar/:groupId",
  protectRoute,
  uploadMiddleware,
  updateGroupAvatar
); // New route for avatar updates

// Group Chat Messaging Routes (reusing personal chat functionality)
router.post("/message/:groupId", protectRoute, sendGroupMessage); // Send a group message
router.post(
  "/message/document/:groupId",
  protectRoute,
  uploadMiddleware,
  sendGroupDocument
); // Send document in group chat
router.post(
  "/message/image/:groupId",
  protectRoute,
  uploadMiddleware,
  sendGroupImage
); // Send image in group chat
router.delete("/message/:groupId/:messageId", protectRoute, deleteGroupMessage); // Delete group message

// Pinned Messages Routes
router.post("/pin/:groupId", protectRoute, pinMessage);
router.post("/unpin/:groupId", protectRoute, unpinMessage);
router.get("/pinned/:groupId", protectRoute, getPinnedMessages);

// Poll Routes
router.post("/poll/:groupId", protectRoute, createPoll);
router.post("/poll/vote/:pollId", protectRoute, votePoll);
router.get("/polls/:groupId", protectRoute, getGroupPolls);

export default router;
