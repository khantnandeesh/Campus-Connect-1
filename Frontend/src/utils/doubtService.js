import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const fetchQuestions = async () => {
  try {
    const response = await apiClient.get("/questions");
    console.log(response.data);

    return response.data;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const fetchAnswersByIds = async (questionId) => {
  try {
    const response = await apiClient.get(`/answers/${questionId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching answers for question", questionId, error);
    return [];
  }
};

export const submitQuestion = async (question) => {
  try {
    console.log(question);
    const response = await apiClient.post("/questions", question);
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error submitting question:", error);
    throw error;
  }
};

// Submit a new answer to a specific question
export const submitAnswer = async (questionId, answer) => {
  try {
    const response = await apiClient.post(
      `/answers/${questionId}/answers`,
      answer
    );
    return response.data;
  } catch (error) {
    console.error("Error submitting answer:", error);
    throw error;
  }
};

// Upvote an answer
export const upvoteAnswer = async (answerId) => {
  try {
    const response = await apiClient.put(`/answers/upvote/${answerId}`);
    return response.data;
  } catch (error) {
    console.error("Error upvoting answer:", error);
    throw error;
  }
};

// Downvote an answer
export const downvoteAnswer = async (answerId) => {
  try {
    const response = await apiClient.put(`/answers/downvote/${answerId}`);
    return response.data;
  } catch (error) {
    console.error("Error downvoting answer:", error);
    throw error;
  }
};

export const deleteQuestionAndAnswers = async (questionId) => {
  return await apiClient.delete(`/questions/${questionId}`);
};
