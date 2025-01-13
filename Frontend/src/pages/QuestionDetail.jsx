import { useEffect, useState, useCallback, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaArrowAltCircleUp,
  FaArrowAltCircleDown,
  FaReply,
} from "react-icons/fa";
import {
  fetchAnswersByIds,
  submitAnswer,
  fetchReplies,
  upvoteAnswer,
  downvoteAnswer,
} from "../utils/Doubts/doubtService";
import {
  subscribeToAnswers,
  subscribeToReplies,
  emitNewAnswer,
  emitNewReply,
} from "../utils/Doubts/socket";
import { Dialog, Transition } from "@headlessui/react";

export const AnswerDialog = ({
  isOpen,
  onClose,
  onSubmit,
  answerText,
  setAnswerText,
  isReply,
}) => {
  const handleAnswerSubmit = () => {
    if (!answerText.trim()) {
      toast.error("Answer cannot be empty!");
      return;
    }
    onSubmit(answerText);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  {isReply ? "Reply to Answer" : "Answer Question"}
                </Dialog.Title>
                <div className="mt-4">
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-200"
                    rows="5"
                    placeholder={
                      isReply
                        ? "Type your reply here..."
                        : "Type your answer here..."
                    }
                  />
                </div>
                <div className="mt-6">
                  <button
                    onClick={handleAnswerSubmit}
                    className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                  >
                    Submit {isReply ? "Reply" : "Answer"}
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg mt-3 hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const AnswerComponent = ({ answer, onReply, onVote }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [replyPage, setReplyPage] = useState(1);
  const [hasMoreReplies, setHasMoreReplies] = useState(true);

  const loadReplies = async () => {
    try {
      const response = await fetchReplies(answer._id, null, 5);
      setReplies(response.replies);
      setHasMoreReplies(response.hasMore);
    } catch (error) {
      console.error("Error loading replies:", error);
    }
  };

  const loadMoreReplies = async () => {
    const lastReply = replies[replies.length - 1];
    const response = await fetchReplies(answer._id, lastReply._id, 5);
    setReplies([...replies, ...response.replies]);
    setHasMoreReplies(response.hasMore);
    setReplyPage((prev) => prev + 1);
  };

  return (
    <div className="bg-[#31363F] p-4 rounded-lg mb-4">
      <p className="mb-4">{answer.content}</p>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onVote(answer._id, "upvote")}
              className="text-gray-400 hover:text-blue-500"
            >
              <FaArrowAltCircleUp size={20} />
              <span>{answer.upvotes}</span>
            </button>
            <button
              onClick={() => onVote(answer._id, "downvote")}
              className="text-gray-400 hover:text-red-500"
            >
              <FaArrowAltCircleDown size={20} />
              <span>{answer.downvotes}</span>
            </button>
          </div>
          <button
            onClick={() => onReply(answer._id)}
            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300"
          >
            <FaReply />
            <span>Reply</span>
          </button>
        </div>
        <span className="text-sm text-gray-400">
          by {answer.createdBy?.username}
        </span>
      </div>
    {/* yaha error hai */}
      {replies.length > 0 && showReplies && (
        <div className="ml-8 mt-4 space-y-4">
          {replies.map((reply) => (
            <div key={reply._id} className="bg-[#404650] p-3 rounded">
              <p>{reply.content}</p>
              <div className="flex justify-end">
                <span className="text-sm text-gray-400">
                  by {reply.createdBy?.username}
                </span>
              </div>
            </div>
          ))}
          {hasMoreReplies && (
            <button
              onClick={loadMoreReplies}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Load more replies...
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => {
          if (!showReplies) loadReplies();
          setShowReplies(!showReplies);
        }}
        className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
      >
        {showReplies ? "Hide replies" : "Show replies"}
      </button>
    </div>
  );
};

const QuestionDetail = () => {
  const { questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadAnswers = async () => {
      try {
        setIsLoading(true);
        const { answers } = await fetchAnswersByIds(questionId);
        setAnswers(answers);
      } catch (error) {
        console.error("Error loading answers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnswers();

    // Subscribe to new answers
    subscribeToAnswers((newAnswer) => {
      if (newAnswer.question === questionId) {
        setAnswers((prev) => [...prev, newAnswer]);
      }
    });

    return () => {
      // Cleanup
    };
  }, [questionId]);

  const loadMoreAnswers = async () => {
    const lastAnswer = answers[answers.length - 1];
    const response = await fetchAnswersByIds(questionId, lastAnswer._id, 10);
    setAnswers([...answers, ...response.answers]);
    setHasMore(response.hasMore);
    setPage((prev) => prev + 1);
  };

  const handleSubmitAnswer = async (content) => {
    try {
      const answer = await submitAnswer(questionId, { content }, replyTo);
      if (replyTo) {
        emitNewReply(replyTo, answer);
      } else {
        emitNewAnswer(answer);
      }
      setIsAnswering(false);
      setReplyTo(null);
      setAnswerText("");
      toast.success("Answer submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit answer");
    }
  };

  const handleVote = async (answerId, voteType) => {
    try {
      const response = await (voteType === "upvote"
        ? upvoteAnswer(answerId)
        : downvoteAnswer(answerId));
      setAnswers((prev) =>
        prev.map((a) => (a._id === answerId ? { ...a, ...response } : a))
      );
    } catch (error) {
      toast.error(`Failed to ${voteType}`);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 bg-[#222831] min-h-screen text-[#EEEEEE]">
      {question && (
        <div className="mb-6 bg-[#31363F] p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-4">{question.title}</h1>
          <p className="mb-4">{question.description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {question.tags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-500 bg-opacity-20 text-blue-300 px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Category: {question.category}</span>
            <span>Asked by: {question.createdBy?.username}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {answers.map((answer) => (
          <AnswerComponent
            key={answer._id}
            answer={answer}
            onReply={(answerId) => {
              setReplyTo(answerId);
              setIsAnswering(true);
            }}
            onVote={handleVote}
          />
        ))}

        {hasMore && (
          <button
            onClick={loadMoreAnswers}
            className="w-full bg-[#31363F] text-blue-400 py-2 rounded-lg hover:bg-[#404650]"
          >
            Load more answers
          </button>
        )}
      </div>

      <button
        onClick={() => {
          setReplyTo(null);
          setIsAnswering(true);
        }}
        className="fixed bottom-4 right-4 p-4 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600"
      >
        Answer
      </button>

      <AnswerDialog
        isOpen={isAnswering}
        onClose={() => {
          setIsAnswering(false);
          setReplyTo(null);
        }}
        onSubmit={handleSubmitAnswer}
        answerText={answerText}
        setAnswerText={setAnswerText}
        isReply={!!replyTo}
      />
    </div>
  );
};

export default QuestionDetail;
