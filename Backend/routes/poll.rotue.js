import express from "express";
import {
  createPoll,
  votePoll,
  getPollsByGroup,
} from "../controllers/pollController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.post("/:groupId", protectRoute, createPoll); // Create a poll
router.post("/vote/:pollId", protectRoute, votePoll); // Vote in a poll
router.get("/:groupId", protectRoute, getPollsByGroup); // Get polls in a group

export default router;
