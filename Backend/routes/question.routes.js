import express from "express";
import {
  createQuestion,
  getAllQuestions,
  deleteQuestionAndAnswers,
} from "../controllers/question.controller.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.post("/", protectRoute, createQuestion);
router.get("/", protectRoute, getAllQuestions);
router.delete("/:questionId", protectRoute, deleteQuestionAndAnswers);

export default router;
