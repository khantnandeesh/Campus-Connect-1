import { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import {
  fetchQuestions,
  submitQuestion,
  submitAnswer,
  upvoteAnswer,
  downvoteAnswer,
  fetchAnswersByIds,
  deleteQuestionAndAnswers,
} from "../utils/doubtService";

const QuestionDialog = ({ isOpen, onClose, onSubmit }) => {
  const [questionText, setQuestionText] = useState("");

  const handleSubmit = () => {
    console.log("Question text:", questionText); // Add debug log
    if (!questionText || questionText.trim() === "") {
      toast.error("Question cannot be empty!");
      return;
    }
    onSubmit(questionText);
    onClose(); // Close the dialog after submission
    setQuestionText(""); // Clear the input
  };

  return isOpen ? (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h3 className="text-xl font-semibold mb-4">Ask a Doubt</h3>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className="w-full p-2 mb-4 border rounded-md"
          rows="4"
          placeholder="Type your question here"
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-green-500 text-white py-2 rounded-md"
        >
          Submit Question
        </button>
        <button
          onClick={onClose}
          className="w-full bg-gray-500 text-white py-2 rounded-md mt-2"
        >
          Close
        </button>
      </div>
    </div>
  ) : null;
};

QuestionDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired, // Must be a boolean value (true/false)
  onClose: PropTypes.func.isRequired, // Must be a function
  onSubmit: PropTypes.func.isRequired, // Must be a function
};

const DoubtsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const loadQuestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedQuestions = await fetchQuestions();

      // Check if fetchedQuestions is null or undefined
      if (!fetchedQuestions) {
        setQuestions([]);
        return;
      }

      const questionsWithAnswers = await Promise.all(
        fetchedQuestions.map(async (question) => {
          const answers = await fetchAnswersByIds(question._id);
          const answersArray = Array.isArray(answers)
            ? answers
            : Object.values(answers);

          return { ...question, answers: answersArray };
        })
      );

      setQuestions(questionsWithAnswers);
    } catch (error) {
      // Only show error if it's not a "no questions" situation
      if (error.response?.status !== 404) {
        setError("Failed to load questions. Please try again later.");
        toast.error("Failed to load questions");
      } else {
        setQuestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadQuestions();

    return () => controller.abort();
  }, [loadQuestions]);

  const toggleDialog = () => {
    setIsDialogOpen(!isDialogOpen);
  };

  const toggleAnswerDialog = (question) => {
    setSelectedQuestion(question);
    setIsAnswerDialogOpen(!isAnswerDialogOpen);
  };

  const handleQuestionSubmit = async (text) => {
    try {
      setIsLoading(true);
      const newQuestion = {
        title: text.slice(0, 100), // Use first 100 chars as title
        description: text,
      };
      await submitQuestion(newQuestion);
      toast.success("Question submitted successfully!");
      await loadQuestions();
    } catch (error) {
      toast.error("Failed to submit question");
      console.error("Error submitting question:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!answerText.trim()) {
      toast.error("Answer cannot be empty!");
      return;
    }

    try {
      setIsLoading(true);
      const answer = { content: answerText, questionId: selectedQuestion._id };
      const createdAnswer = await submitAnswer(answer.questionId, answer);
      setIsAnswerDialogOpen(false);
      setAnswerText("");
      await loadQuestions();
    } catch (error) {
      toast.error("Failed to submit answer");
      console.error("Error submitting answer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async (questionId, answerId) => {
    try {
      const updatedAnswer = await upvoteAnswer(answerId);

      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q._id === questionId
            ? {
                ...q,
                answers: q.answers.map((a) =>
                  a._id === answerId
                    ? {
                        ...a,
                        upvotes: updatedAnswer.upvotes,
                      }
                    : a
                ),
              }
            : q
        )
      );
    } catch (error) {
      toast.error("Failed to upvote answer");
      console.error("Error upvoting answer:", error);
    }
  };

  const handleDownvote = async (questionId, answerId) => {
    try {
      const updatedAnswer = await downvoteAnswer(answerId);

      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q._id === questionId
            ? {
                ...q,
                answers: q.answers.map((a) =>
                  a._id === answerId
                    ? {
                        ...a,
                        downvotes: updatedAnswer.downvotes,
                      }
                    : a
                ),
              }
            : q
        )
      );
    } catch (error) {
      toast.error("Failed to downvote answer");
      console.error("Error downvoting answer:", error);
    }
  };

  const handleResolveQuestion = async (questionId) => {
    try {
      await deleteQuestionAndAnswers(questionId);
      setQuestions((prevQuestions) =>
        prevQuestions.filter((q) => q._id !== questionId)
      );
    } catch (error) {
      toast.error("Failed to resolve question");
      console.error("Error resolving question:", error);
    }
  };

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={loadQuestions}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}

      <h2 className="text-3xl font-semibold mb-6">All Doubts</h2>

      {questions.length === 0 && !isLoading && !error ? (
        <div className="text-center">
          <p className="text-gray-500 mb-4">
            No questions yet. Be the first to ask!
          </p>
          <button
            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
            onClick={toggleDialog}
          >
            Ask a Question
          </button>
        </div>
      ) : (
        <div
          className="space-y-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {questions.map((question) => (
            <div
              key={question._id}
              className="bg-white p-4 rounded-lg shadow-md"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xl font-semibold">{question.title}</h4>
                <p className="text-sm text-gray-500">
                  Asked by: {question.createdBy?.username}
                </p>
              </div>
              <p className="mb-2">{question.description}</p>
              <button
                className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
                onClick={() => toggleAnswerDialog(question)}
              >
                Answer
              </button>
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 ml-2"
                onClick={() =>
                  setQuestions((prevQuestions) =>
                    prevQuestions.map((q) =>
                      q._id === question._id
                        ? { ...q, showAllAnswers: !q.showAllAnswers }
                        : q
                    )
                  )
                }
              >
                {question.showAllAnswers
                  ? "Hide All Answers"
                  : "Show All Answers"}
              </button>
              <button
                className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 ml-2"
                onClick={() => handleResolveQuestion(question._id)}
              >
                Resolve
              </button>
              {question.showAllAnswers && (
                <div className="mt-4 space-y-2">
                  {question.answers?.map((answer) => (
                    <div
                      key={answer._id}
                      className="bg-gray-50 p-4 rounded-lg shadow-sm"
                    >
                      <p>{answer.content || "Answer content not available"}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-gray-500 italic">
                          Answered by: {answer.createdBy?.username || "Unknown"}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            className="bg-green-500 text-white py-1 px-2 rounded-lg hover:bg-green-600"
                            onClick={() =>
                              handleUpvote(question._id, answer._id)
                            }
                          >
                            Upvote ({answer.upvotes || 0})
                          </button>
                          <button
                            className="bg-red-500 text-white py-1 px-2 rounded-lg hover:bg-red-600"
                            onClick={() =>
                              handleDownvote(question._id, answer._id)
                            }
                          >
                            Downvote ({answer.downvotes || 0})
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        className="fixed bottom-4 right-4 p-4 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 focus:outline-none"
        onClick={toggleDialog}
      >
        Ask a Doubt
      </button>

      <QuestionDialog
        isOpen={isDialogOpen}
        onClose={toggleDialog}
        onSubmit={handleQuestionSubmit}
      />

      {isAnswerDialogOpen && selectedQuestion && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h3 className="text-xl font-semibold mb-4">Answer Question</h3>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="w-full p-2 mb-4 border rounded-md"
              rows="4"
              placeholder="Type your answer here"
            />
            <button
              onClick={handleAnswerSubmit}
              className="w-full bg-green-500 text-white py-2 rounded-md"
            >
              Submit Answer
            </button>
            <button
              onClick={() => setIsAnswerDialogOpen(false)}
              className="w-full bg-gray-500 text-white py-2 rounded-md mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoubtsPage;
