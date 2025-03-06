import express from "express";
import {
  createGroup,
  getGroupsByCollege,
  joinPublicGroup,
  handleGroupRequest,
  postAnnouncement,
  pinMessage,
} from "../controllers/groupController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup); // Create a new group
router.get("/", protectRoute, getGroupsByCollege); // Get all groups for a college
router.post("/join/:groupId", protectRoute, joinPublicGroup); // Join a public group
router.post("/request/:groupId", protectRoute, handleGroupRequest); // Request to join a private group
router.post("/announcement/:groupId", protectRoute, postAnnouncement); // Post group/global announcement
router.post("/pin/:groupId", protectRoute, pinMessage); // Pin a message in a group

export default router;
