import express from "express";
import {
  getAnswers,
  addAnswer,
  upvoteAnswer,
  downvoteAnswer,
} from "../controllers/answer.controller.js";
import protectRoute from "../middlewares/protectRoute.js";
const router = express.Router();

router.post("/:questionId/answers", protectRoute, addAnswer);
router.get("/:questionId", protectRoute, getAnswers);
router.put("/upvote/:answerId", protectRoute, upvoteAnswer);
router.put("/downvote/:answerId", protectRoute, downvoteAnswer);

export default router;
