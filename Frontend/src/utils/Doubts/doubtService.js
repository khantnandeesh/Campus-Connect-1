import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const fetchQuestions = async (
  page = 1,
  limit = 10,
  sortBy = "newest",
  category = "",
  tags = ""
) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      ...(category && { category }),
      ...(tags && { tags }),
    });

    const response = await apiClient.get(`/questions?${params}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const fetchAnswersByIds = async (
  questionId,
  cursor = null,
  limit = 10
) => {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(cursor && { cursor }),
    });

    const response = await apiClient.get(`/answers/${questionId}?${params}`);
    console.log("Answers response:", response.data); // Add this for debugging
    return {
      answers: response.data, // Change this line to match backend response
      hasMore: false, // Backend needs to provide this
      nextCursor: null, // Backend needs to provide this
    };
  } catch (error) {
    console.error("Error fetching answers for question", questionId, error);
    return { answers: [], hasMore: false, nextCursor: null };
  }
};

export const fetchReplies = async (answerId, cursor = null, limit = 5) => {
  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.append("cursor", cursor);

    const response = await apiClient.get(
      `/answers/replies/${answerId}?${params}`
    );
    console.log(response.data);

    return response.data;
  } catch (error) {
    console.error("Error fetching replies for answer", answerId, error);
    return { replies: [], hasMore: false, nextCursor: null };
  }
};

export const submitQuestion = async (question) => {
  try {
    // console.log(question);
    const response = await apiClient.post("/questions", question);
    // console.log(response.data);
    return response.data;
  } catch (error) {
    console.error("Error submitting question:", error);
    throw error;
  }
};

// Submit a new answer to a specific question
export const submitAnswer = async (questionId, answer, parentId = null) => {
  try {
    const endpoint = parentId
      ? `/answers/${questionId}/answers/${parentId}/reply`
      : `/answers/${questionId}/answers`;
    // const payload = {
    //   content: answer
    // };

    const response = await apiClient.post(endpoint, answer);
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

export const upvoteQuestion = async (questionId) => {
  try {
    const response = await apiClient.put(`/questions/upvote/${questionId}`);
    return response.data;
  } catch (error) {
    console.error("Error upvoting question:", error);
    throw error;
  }
};

export const downvoteQuestion = async (questionId) => {
  try {
    console.log(questionId);
    const response = await apiClient.put(`/questions/downvote/${questionId}`);
    return response.data;
  } catch (error) {
    console.error("Error downvoting question:", error);
    throw error;
  }
};

export const deleteQuestionAndAnswers = async (questionId) => {
  return await apiClient.delete(`/questions/${questionId}`);
};
