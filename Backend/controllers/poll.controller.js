import Poll from "../models/Poll.js";

// Create a poll
export const createPoll = async (req, res) => {
  try {
    const { question, options } = req.body;
    const userId = req.user.id;
    const { groupId } = req.params;

    const poll = new Poll({
      question,
      options,
      createdBy: userId,
      group: groupId,
    });
    await poll.save();
    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: "Error creating poll", error });
  }
};

// Vote in a poll
export const votePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user.id;

    const poll = await Poll.findById(pollId);
    if (poll.voters.includes(userId))
      return res.status(400).json({ message: "Already voted" });

    poll.options[optionIndex].votes += 1;
    poll.voters.push(userId);
    await poll.save();

    res.json({ message: "Vote registered", poll });
  } catch (error) {
    res.status(500).json({ message: "Error voting", error });
  }
};

// Get polls of a group
export const getPollsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const polls = await Poll.find({ group: groupId });
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: "Error fetching polls", error });
  }
};
