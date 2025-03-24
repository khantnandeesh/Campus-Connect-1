import { useState, useEffect } from "react";
import { votePoll } from "../../utils/groupService";
import { toast } from "react-hot-toast";
import { BarChart2 } from "lucide-react";

const PollMessage = ({ poll, authUser }) => {
  const [results, setResults] = useState(poll?.options || []);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (poll?.options) {
      setResults(poll.options);
      setHasVoted(poll.voters?.includes(authUser?._id));
    }
  }, [poll, authUser]);

  const totalVotes =
    results?.reduce((acc, option) => acc + (option.votes || 0), 0) || 0;

  const handleVote = async (optionIndex) => {
    if (hasVoted) return;
    setLoading(true);
    try {
      const updatedPoll = await votePoll(poll._id, optionIndex);
      if (updatedPoll?.options) {
        setResults(updatedPoll.options);
        setHasVoted(true);
      }
    } catch (error) {
      toast.error("Failed to vote");
    } finally {
      setLoading(false);
    }
  };

  if (!poll?._id || !poll?.options) {
    return null; // or return a loading/error state
  }

  return (
    <div className="bg-blue-900/30 p-4 rounded-lg shadow-lg max-w-md w-full">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="text-blue-400" size={20} />
        <h3 className="font-semibold text-lg text-white">{poll.question}</h3>
      </div>

      <div className="space-y-3">
        {results.map((option, index) => {
          const percentage = totalVotes ? (option.votes / totalVotes) * 100 : 0;

          return (
            <button
              key={index}
              disabled={hasVoted || loading}
              onClick={() => handleVote(index)}
              className="w-full relative group"
            >
              <div
                className="relative z-10 p-3 rounded-lg border border-blue-500/30 
                hover:border-blue-400 transition-colors duration-200 
                bg-gradient-to-r from-blue-900/40 to-blue-800/40"
              >
                <div className="flex justify-between items-center relative z-10">
                  <span className="text-white">{option.text}</span>
                  {hasVoted && (
                    <span className="text-blue-300">
                      {Math.round(percentage)}%
                    </span>
                  )}
                </div>
              </div>
              {hasVoted && (
                <div
                  className="absolute inset-0 bg-blue-500/20 rounded-lg transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-gray-400 flex justify-between">
        <span>{totalVotes} votes</span>
        {poll.expiresAt && (
          <span>Ends {new Date(poll.expiresAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};

export default PollMessage;
