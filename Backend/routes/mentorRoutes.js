import express from "express";
import {
  submitApplication,
  getApplicationStatus,
  updateApplicationStars
} from "../controllers/mentorApplicationController.js";
import protectRoute from "../middleware/protectRoute.js";
import {
  getAllMentors,
  getMentorProfile,
  getMentorsFromCollege,
  updateApplication
} from "../controllers/mentorController.js";
import { protect } from "../middleware/authMiddleware.js";

const  router = express.Router();

router.post("/apply", protectRoute, submitApplication);
router.get("/status", protectRoute, getApplicationStatus);
router.put("/update-application", protectRoute, updateApplication);
router.put("/update-stars", protectRoute, updateApplicationStars);
router.get("/college-mentors", protectRoute, getAllMentors);
router.get("/mentor/:mentorId", protectRoute, getMentorProfile);
router.post("/college", protectRoute, getMentorsFromCollege);

export default router;
