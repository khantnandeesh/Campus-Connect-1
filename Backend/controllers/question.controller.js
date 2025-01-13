import Question from "../models/question.model.js";
import Answer from "../models/answer.model.js";

// Create a new question
export const createQuestion = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    const { title, description, tags, category } = req.body;
    const userId = req.user._id;

    const newQuestion = new Question({
      title,
      description,
      tags,
      category,
      createdBy: userId,
    });

    await newQuestion.save();

    const questionWithUser = await Question.findById(newQuestion._id).populate(
      "createdBy",
      "username"
    );

    return res.status(201).json(questionWithUser);
  } catch (error) {
    console.error("Error creating question:", error);
    return res.status(500).json({ message: "Error creating question", error });
  }
};

export const getAllQuestions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "newest";
    const category = req.query.category;
    const tags = req.query.tags;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    if (category) query.category = category;
    if (tags) query.tags = { $in: tags.split(",") };

    // Build sort options
    const sortOptions = {};
    switch (sortBy) {
      case "most_upvotes":
        sortOptions.upvotes = -1;
        break;
      case "newest":
      default:
        sortOptions.createdAt = -1;
    }

    const questions = await Question.find(query)
      .populate("createdBy", "username")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const totalQuestions = await Question.countDocuments(query);
    const hasMore = totalQuestions > skip + questions.length;

    return res.status(200).json({
      questions,
      currentPage: page,
      totalPages: Math.ceil(totalQuestions / limit),
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return res.status(500).json({ message: "Error fetching questions", error });
  }
};

export const upvoteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await Question.findById(questionId);
    question.upvotes += 1;
    await question.save();

    return res.status(200).json(question);
  } catch (error) {
    return res.status(500).json({ message: "Failed to upvote question" });
  }
};

export const downvoteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId);
    question.downvotes += 1;

    await question.save();

    return res.status(200).json(question);
  } catch (error) {
    return res.status(500).json({ message: "Failed to downvote question" });
  }
};

export const deleteQuestionAndAnswers = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user._id;

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (question.createdBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this question" });
    }

    await Answer.deleteMany({ question: questionId });

    await Question.findByIdAndDelete(questionId);

    return res
      .status(200)
      .json({ message: "Question and answers deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete question and answers", error });
  }
};
