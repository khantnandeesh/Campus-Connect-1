import express from "express";
import {
  getAnswers,
  addAnswer,
  upvoteAnswer,
  downvoteAnswer,
  getReplies,
} from "../controllers/answer.controller.js";
import protectRoute from "../middlewares/protectRoute.js";
const router = express.Router();

router.post("/:questionId/answers", protectRoute, addAnswer);
router.post("/:questionId/answers/:parentId/reply", protectRoute, addAnswer); // New route for replies
// GET /:questionId?cursor=lastAnswerId&limit=10
router.get("/:questionId", protectRoute, getAnswers);
// GET /replies/:answerId?cursor=lastReplyId&limit=5
router.get("/replies/:answerId", protectRoute, getReplies); // New route for fetching replies
router.put("/upvote/:answerId", protectRoute, upvoteAnswer);
router.put("/downvote/:answerId", protectRoute, downvoteAnswer);

export default router;
