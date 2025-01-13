import User from "../models/user.model.js";
import Answer from "../models/answer.model.js";
import Question from "../models/question.model.js";

export const addAnswer = async (req, res) => {
  try {
    const { content, questionId } = req.body;
    const { parentId } = req.params;

    const answer = await Answer.create({
      content,
      createdBy: req.user._id,
      question: questionId,
      parent: parentId || null,
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
    const { cursor, limit = 10 } = req.query;

    const query = {
      question: questionId,
      parent: null, // Get only top-level answers
    };

    // If cursor is provided, fetch answers created before the cursor
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const answers = await Answer.find(query)
      .populate("createdBy", "username email")
      .sort({ _id: -1 })
      .limit(parseInt(limit) + 1); // Fetch one extra to check if more exists

    const hasMore = answers.length > limit;
    const nextCursor = hasMore ? answers[answers.length - 2]._id : null;

    // Remove the extra answer if it exists
    if (hasMore) {
      answers.pop();
    }

    return res.status(200).json({
      answers,
      hasMore,
      nextCursor: nextCursor ? nextCursor.toString() : null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch answers", error });
  }
};

export const getReplies = async (req, res) => {
  try {
    const { answerId } = req.params;

    const replies = await Answer.find({
      parent: answerId,
    })
      .populate("createdBy", "username email")
      .sort({ createdAt: 1 });

    return res.status(200).json(replies);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch replies", error });
  }
};
