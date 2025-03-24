import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getSuggestedUsers,
  searchUsers,
  getFriendRequests,
  updateAvatar,
  removeFriend,
} from "../controllers/user.controller.js";
import protectRoute from "../middlewares/protectRoute.js";
import { uploadMiddleware } from "../controllers/upload.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers); // Ensure this is defined before any route with :id
router.get("/friend-requests", protectRoute, getFriendRequests); // Add this new route
router.get("/:id", protectRoute, getUserProfile);
router.put("/:id", protectRoute, updateUserProfile);
router.get("/suggestions", protectRoute, getSuggestedUsers);
router.post("/friend-request/:id", protectRoute, sendFriendRequest);
router.post("/accept-request/:id", protectRoute, acceptFriendRequest);
router.post("/reject-request/:id", protectRoute, rejectFriendRequest);
router.put("/avatar/:id", protectRoute, uploadMiddleware, updateAvatar);
router.post("/remove-friend/:id", protectRoute, removeFriend);

export default router;
