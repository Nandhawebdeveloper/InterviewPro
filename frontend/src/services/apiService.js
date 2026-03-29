/**
 * services/apiService.js - Centralized API Service
 *
 * Wraps the Axios client so every component call is clean:
 *
 *   const res = await apiService.get("/api/dashboard/summary");
 *   console.log("res", res);
 *   if (!res.success) { setError(res.message); return; }
 *   use(res.data);
 *
 * Always resolves — never throws for business-logic failures.
 * Returns the full standard backend response shape:
 *   { success: true,  message: "...", data: { ... } }
 *   { success: false, message: "...", data: {}      }
 *
 * Network / HTTP errors are also caught and converted to the same shape.
 */

import client from "./api";

/**
 * Core handler — every method funnels through here.
 * @param {Promise} requestPromise - The Axios call (already configured).
 * @returns {Promise<{ success: boolean, message: string, data: any }>}
 *   Always resolves with the standard response shape.
 */
const handleResponse = async (requestPromise) => {
  try {
    const response = await requestPromise;
    return {
      ...response.data,
        request: {
          method: response.config.method?.toUpperCase(),
          baseURL: response.config.baseURL,
          url: response.config.url,
          fullURL: `${response.config.baseURL || ""}${response.config.url || ""}`,
          params: response.config.params,
          data: response.config.data,
          headers: response.config.headers,
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers,
        },
    };
  } catch (error) {
    const debugResponse = error.response || {};
    return {
      success: false,
      message: error.displayMessage || error.message || "Request failed",
      data: {},
        request: {
          method: error.config?.method?.toUpperCase(),
          baseURL: error.config?.baseURL,
          url: error.config?.url,
          fullURL: `${error.config?.baseURL || ""}${error.config?.url || ""}`,
          params: error.config?.params,
          data: error.config?.data,
          headers: error.config?.headers,
        },
        response: {
          status: debugResponse.status,
          statusText: debugResponse.statusText,
          data: debugResponse.data,
          headers: debugResponse.headers,
        },
    };
  }
};

const apiService = {
  /**
   * GET request.
   * @param {string} url
   * @param {object} [params] - Query parameters.
   * @returns {Promise<{ success: boolean, message: string, data: any }>}
   */
  get: (url, params = {}) => handleResponse(client.get(url, { params })),

  /**
   * POST request.
   * @param {string} url
   * @param {object} [body] - Request body.
   * @returns {Promise<{ success: boolean, message: string, data: any }>}
   */
  post: (url, body = {}) => handleResponse(client.post(url, body)),

  /**
   * PUT request.
   * @param {string} url
   * @param {object} [body] - Request body.
   * @returns {Promise<{ success: boolean, message: string, data: any }>}
   */
  put: (url, body = {}) => handleResponse(client.put(url, body)),

  /**
   * DELETE request.
   * @param {string} url
   * @returns {Promise<{ success: boolean, message: string, data: any }>}
   */
  remove: (url) => handleResponse(client.delete(url)),
};

export default apiService;
