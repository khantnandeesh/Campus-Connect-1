import User from "../models/user.model.js";
import Answer from "../models/answer.model.js";
import Question from "../models/question.model.js";

export const addAnswer = async (req, res) => {
  try {
    const { content, questionId } = req.body;

    const answer = await Answer.create({
      content,
      createdBy: req.user._id,
      question: questionId,
    });

    await Question.findByIdAndUpdate(questionId, {
      $push: { answers: answer._id },
    });

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { auraPoints: 5 },
    });

    return res.status(201).json(answer);
  } catch (error) {
    return res.status(500).json({ message: "Failed to add answer", error });
  }
};

export const upvoteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;

    const answer = await Answer.findById(answerId);

    if (answer.upvoters.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You have already upvoted this answer." });
    }

    if (answer.downvoters.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You have already downvoted this answer." });
    }

    answer.upvotes += 1;
    answer.upvoters.push(req.user._id);

    await User.findByIdAndUpdate(answer.createdBy, {
      $inc: { auraPoints: 10 },
    });

    await answer.save();

    return res.status(200).json(answer);
  } catch (error) {
    return res.status(500).json({ message: "Failed to upvote answer" });
  }
};

export const downvoteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;

    const answer = await Answer.findById(answerId);

    if (answer.downvoters.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You have already downvoted this answer." });
    }

    if (answer.upvoters.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You have already upvoted this answer." });
    }

    answer.downvotes += 1;
    answer.downvoters.push(req.user._id);

    await answer.save();

    return res.status(200).json(answer);
  } catch (error) {
    return res.status(500).json({ message: "Failed to downvote answer" });
  }
};

export const getAnswers = async (req, res) => {
  try {
    const { questionId } = req.params;

    const answers = await Answer.find({ question: questionId })
      .populate("createdBy", "username email") // Populate the createdBy field with user data (e.g., username, email)
      .sort({ upvotes: -1 }); // Sort answers by creation date (newest first)

    if (!answers) {
      return res
        .status(404)
        .json({ message: "No answers found for this question" });
    }

    return res.status(200).json(answers);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch answers", error });
  }
};
