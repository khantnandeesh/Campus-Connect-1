import express from "express";
import {
  sendJoinRequest,
  approveRequest,
  rejectRequest,
} from "../controllers/groupRequestController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.post("/:groupId", protectRoute, sendJoinRequest); // Request to join a group
router.post("/approve/:requestId", protectRoute, approveRequest); // Approve request
router.post("/reject/:requestId", protectRoute, rejectRequest); // Reject request

export default router;
