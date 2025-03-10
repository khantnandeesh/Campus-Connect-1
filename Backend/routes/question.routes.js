import express from "express";
import {
  createQuestion,
  getAllQuestions,
  deleteQuestionAndAnswers,
  upvoteQuestion,
  downvoteQuestion,
} from "../controllers/question.controller.js";
import protectRoute from "../middleware/protectRoute.js";
const router = express.Router();

router.post("/", protectRoute, createQuestion);
router.put("/upvote/:questionId", upvoteQuestion);
router.put("/downvote/:questionId", downvoteQuestion);
// GET /?page=1&limit=10
router.get("/", protectRoute, getAllQuestions);

router.delete("/:questionId", protectRoute, deleteQuestionAndAnswers);

export default router;
