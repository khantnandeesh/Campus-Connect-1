import express from "express";
import {
  getUser,
  getRecommendedGroups,
  updateUserSettings,
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/:id", protectRoute, getUser); // Get user details
router.get("/:id/recommendations", protectRoute, getRecommendedGroups); // Get group recommendations
router.post("/:id/settings", protectRoute, updateUserSettings); // Update notification settings

export default router;
