/**
 * services/api.js - Axios API Client
 *
 * Configures Axios with base URL, interceptors for auth tokens,
 * and centralized error handling.
 */

import axios from "axios";

// const BASE_URL = import.meta.env.VITE_API_URL;
const BASE_URL = "https://interviewpro-backend-pvzz.onrender.com";
console.log("API Base URL :", BASE_URL);

// Create Axios instance with default configuration
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

/**
 * Request interceptor - Attach JWT token to every request.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor - Handle common error responses.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Attach a clean message to the error for components to display
      error.displayMessage = data?.message || data?.error || "Something went wrong. Please try again.";

      // Token expired or invalid – force logout
      if (status === 401) {
        const code = data?.code;
        if (code === "TOKEN_EXPIRED" || code === "INVALID_TOKEN") {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
    } else if (error.request) {
      // Network error – no response received
      error.displayMessage = "Cannot connect to server. Please check your connection.";
    } else {
      error.displayMessage = error.message || "An unexpected error occurred.";
    }
    return Promise.reject(error);
  },
);

export default api;
