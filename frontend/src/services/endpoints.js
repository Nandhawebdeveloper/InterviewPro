/**
 * services/endpoints.js - Named API Functions
 *
 * Each function maps to one backend endpoint.
 * Components pass only the form/business parameters — no URLs,
 * no body construction, no success checks needed at the call site.
 *
 * Usage in component:
 *   const data = await endpoints.login(email, password);
 *   const data = await endpoints.createQuestion(title, description, type, difficulty, topic, options, correctAnswer);
 *
 * On failure, apiService throws Error(message) — just catch it.
 */

import apiService from "./apiService";

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

/**
 * Login with email and password.
 * @returns {{ token, user }}
 */
const login = (email, password) => apiService.post("/api/login", { email, password });

/**
 * Register a new user account.
 * @returns {{ user }}
 */
const register = (name, email, password) => apiService.post("/api/register", { name, email, password });

/**
 * Get the currently authenticated user's profile.
 * @returns {{ user }}
 */
const getMe = () => apiService.get("/api/me");

// ─────────────────────────────────────────────
// QUESTIONS
// ─────────────────────────────────────────────

/**
 * Get paginated question list with optional filters.
 * @param {object} filters - { type, difficulty, topic, page, per_page }
 * @returns {{ questions, total, pages, current_page }}
 */
const getQuestions = (filters = {}) => apiService.get("/api/questions", filters);

/**
 * Get a single question by ID.
 * @returns {{ question }}
 */
const getQuestion = (id) => apiService.get(`/api/questions/${id}`);

/**
 * Get all unique topics.
 * @returns {{ topics }}
 */
const getTopics = () => apiService.get("/api/questions/topics");

/**
 * Create a new question (admin only).
 * @returns {{ question }}
 */
const createQuestion = (title, description, type, difficulty, topic, options, correctAnswer) =>
  apiService.post("/api/questions", {
    title,
    description,
    type,
    difficulty,
    topic,
    options,
    correct_answer: correctAnswer,
  });

/**
 * Update an existing question (admin only).
 * @returns {{ question }}
 */
const updateQuestion = (id, title, description, type, difficulty, topic, options, correctAnswer) =>
  apiService.put(`/api/questions/${id}`, {
    title,
    description,
    type,
    difficulty,
    topic,
    options,
    correct_answer: correctAnswer,
  });

/**
 * Delete a question (admin only).
 */
const deleteQuestion = (id) => apiService.remove(`/api/questions/${id}`);

// ─────────────────────────────────────────────
// ATTEMPTS
// ─────────────────────────────────────────────

/**
 * Submit a practice attempt for a question.
 * @returns {{ attempt, is_correct, correct_answer }}
 */
const submitAttempt = (questionId, selectedAnswer) =>
  apiService.post("/api/attempt", {
    question_id: questionId,
    selected_answer: selectedAnswer,
  });

/**
 * Get attempt history for a user.
 * @returns {{ attempts, total, pages, current_page }}
 */
const getUserAttempts = (userId, page = 1, perPage = 20) =>
  apiService.get(`/api/attempts/user/${userId}`, { page, per_page: perPage });

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

/**
 * Get the current user's dashboard analytics summary.
 * @returns {{ total_attempts, correct_attempts, accuracy, topic_performance, ... }}
 */
const getDashboardSummary = () => apiService.get("/api/dashboard/summary");

/**
 * Get topic-wise performance.
 * @returns {{ topic_performance }}
 */
const getTopicPerformance = () => apiService.get("/api/dashboard/topic-performance");

/**
 * Get difficulty-wise performance.
 * @returns {{ difficulty_performance }}
 */
const getDifficultyPerformance = () => apiService.get("/api/dashboard/difficulty-performance");

/**
 * Get 7-day activity timeline.
 * @returns {{ activity }}
 */
const getActivity = () => apiService.get("/api/dashboard/activity");

/**
 * Get practice streak info.
 * @returns {{ current_streak, longest_streak, last_practice_date }}
 */
const getStreak = () => apiService.get("/api/dashboard/streak");

/**
 * Get weak topic recommendations.
 * @returns {{ weak_topics, suggestion }}
 */
const getRecommendations = () => apiService.get("/api/dashboard/recommendations");

// ─────────────────────────────────────────────
// AI QUESTION GENERATOR
// ─────────────────────────────────────────────

/**
 * Generate a new question using local templates.
 * @param {string} topic
 * @param {string} difficulty
 * @param {string} type - "MCQ" or "CODING"
 * @returns {{ question }}
 */
const generateQuestion = (topic, difficulty, type) =>
  apiService.post("/api/questions/generate", { topic, difficulty, type });

/**
 * Generate a question using OpenAI API with daily limits and fallback.
 * @param {string} topic
 * @param {string} difficulty
 * @param {string} type - "MCQ" or "CODING"
 * @returns {{ question, usage: { used, limit, remaining } }}
 */
const aiGenerateQuestion = (topic, difficulty, type) =>
  apiService.post("/api/ai/generate", { topic, difficulty, type });

/**
 * Get AI usage stats for today.
 * @returns {{ used, limit, remaining, date }}
 */
const getAIUsage = () => apiService.get("/api/ai/usage");

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────

/**
 * Get current user's profile with stats.
 * @returns {{ profile }}
 */
const getProfile = () => apiService.get("/api/profile");

/**
 * Update profile (name and/or password).
 * @param {object} data - { name, current_password, new_password }
 * @returns {{ profile }}
 */
const updateProfile = (data) => apiService.put("/api/profile", data);

// ─────────────────────────────────────────────
// BOOKMARKS
// ─────────────────────────────────────────────

/**
 * Add a question to bookmarks.
 * @param {number} questionId
 * @returns {{ bookmark }}
 */
const addBookmark = (questionId) => apiService.post("/api/bookmarks", { question_id: questionId });

/**
 * Get all bookmarked questions.
 * @returns {{ bookmarks }}
 */
const getBookmarks = () => apiService.get("/api/bookmarks");

/**
 * Remove a bookmark by ID.
 * @param {number} bookmarkId
 */
const removeBookmark = (bookmarkId) => apiService.remove(`/api/bookmarks/${bookmarkId}`);

/**
 * Remove a bookmark by question ID.
 * @param {number} questionId
 */
const removeBookmarkByQuestion = (questionId) => apiService.remove(`/api/bookmarks/question/${questionId}`);

/**
 * Check if a question is bookmarked.
 * @param {number} questionId
 * @returns {{ is_bookmarked, bookmark_id }}
 */
const checkBookmark = (questionId) => apiService.get(`/api/bookmarks/check/${questionId}`);

// ─────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────

/**
 * Get top users leaderboard.
 * @param {number} limit
 * @returns {{ leaderboard }}
 */
const getLeaderboard = (limit = 20) => apiService.get("/api/leaderboard", { limit });

// ─────────────────────────────────────────────
// CODE EXECUTION
// ─────────────────────────────────────────────

const runCode = (language, code) => apiService.post("/api/code/run", { language, code });

// ─────────────────────────────────────────────
// DISCUSSIONS
// ─────────────────────────────────────────────

const getDiscussions = (questionId) => apiService.get(`/api/questions/${questionId}/discussions`);
const postDiscussion = (questionId, comment, parentId = null) =>
  apiService.post(`/api/questions/${questionId}/discussions`, { comment, parent_id: parentId });
const upvoteDiscussion = (discussionId) => apiService.post(`/api/discussions/${discussionId}/upvote`);
const deleteDiscussion = (discussionId) => apiService.remove(`/api/discussions/${discussionId}`);

// ─────────────────────────────────────────────
// ROADMAP
// ─────────────────────────────────────────────

const getRoadmaps = () => apiService.get("/api/roadmap");
const getRoadmap = (role) => apiService.get(`/api/roadmap/${role}`);

// ─────────────────────────────────────────────
// MOCK INTERVIEW
// ─────────────────────────────────────────────

const startInterview = (config) => apiService.post("/api/interview/start", config);
const submitInterview = (interviewId, answers) => apiService.post(`/api/interview/${interviewId}/submit`, { answers });
const getInterviewResult = (interviewId) => apiService.get(`/api/interview/${interviewId}/result`);
const getInterviewHistory = () => apiService.get("/api/interview/history");
const deleteInterview = (interviewId) => apiService.remove(`/api/interview/${interviewId}`);
const resumeInterview = (interviewId) => apiService.get(`/api/interview/${interviewId}/resume`);

// ─────────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────────

const getAllBadges = () => apiService.get("/api/badges");
const getMyBadges = () => apiService.get("/api/badges/my");
const checkBadges = () => apiService.post("/api/badges/check");

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

/**
 * Get system-wide analytics (admin only).
 * @returns {{ total_users, total_questions, total_attempts, system_accuracy, ... }}
 */
const getAdminAnalytics = () => apiService.get("/api/admin/analytics");

/**
 * Get all registered users (admin only).
 * @returns {{ users }}
 */
const getAllUsers = () => apiService.get("/api/admin/users");

/**
 * Delete a user by ID (admin only).
 */
const deleteUser = (id) => apiService.remove(`/api/admin/users/${id}`);

// ─────────────────────────────────────────────

const endpoints = {
  // Auth
  login,
  register,
  getMe,
  // Questions
  getQuestions,
  getQuestion,
  getTopics,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  // Attempts
  submitAttempt,
  getUserAttempts,
  // Dashboard
  getDashboardSummary,
  getTopicPerformance,
  getDifficultyPerformance,
  getActivity,
  getStreak,
  getRecommendations,
  // AI Generator
  generateQuestion,
  aiGenerateQuestion,
  getAIUsage,
  // Profile
  getProfile,
  updateProfile,
  // Bookmarks
  addBookmark,
  getBookmarks,
  removeBookmark,
  removeBookmarkByQuestion,
  checkBookmark,
  // Leaderboard
  getLeaderboard,
  // Admin
  getAdminAnalytics,
  getAllUsers,
  deleteUser,
  // Code Execution
  runCode,
  // Discussions
  getDiscussions,
  postDiscussion,
  upvoteDiscussion,
  deleteDiscussion,
  // Roadmap
  getRoadmaps,
  getRoadmap,
  // Mock Interview
  startInterview,
  submitInterview,
  getInterviewResult,
  getInterviewHistory,
  deleteInterview,
  resumeInterview,
  // Badges
  getAllBadges,
  getMyBadges,
  checkBadges,
};

export default endpoints;
