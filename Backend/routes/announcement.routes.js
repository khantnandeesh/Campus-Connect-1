import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  updateAnnouncement,
} from "../controllers/announcement.controller.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.post("/", protectRoute, createAnnouncement); // Create an announcement
router.get("/", protectRoute, getAnnouncements); // Get all announcements
router.delete("/:announcementId", protectRoute, deleteAnnouncement); // Delete an announcement
router.put("/:announcementId", protectRoute, updateAnnouncement); // Update an announcement

export default router;
