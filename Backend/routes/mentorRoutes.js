import express from "express";
import {
  submitApplication,
  getApplicationStatus
} from "../controllers/mentorApplicationController.js";
import protectRoute from "../middlewares/protectRoute.js";
import {
  getAllMentors,
  getMentorProfile,
  getMentorsFromCollege,
  updateApplication
} from "../controllers/mentorController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/apply", protectRoute, submitApplication);
router.get("/status", protectRoute, getApplicationStatus);
router.put("/update-application", protectRoute, updateApplication);
router.get("/college-mentors", protectRoute, getAllMentors);
router.get("/mentor/:mentorId", protectRoute, getMentorProfile);
router.get("/college", protectRoute, getMentorsFromCollege);

export default router;
