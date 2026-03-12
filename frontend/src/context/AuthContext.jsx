/**
 * context/AuthContext.jsx - Authentication Context
 *
 * Provides global authentication state management using React Context.
 * Handles login, logout, registration, and token persistence.
 */

import { createContext, useContext, useState, useEffect } from "react";
import endpoints from "../services/endpoints";

const AuthContext = createContext(null);

/**
 * Custom hook to access auth context.
 * @returns {object} Auth context value.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * AuthProvider - Wraps the app to provide auth state.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Runs ONCE on mount — restores session from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        const res = await endpoints.getMe();
        console.log("getMeRes", res);
        if (!res.success) {
          // Token is invalid or expired — clear it
          localStorage.removeItem("token");
          setUser(null);
        } else {
          setUser(res.data.user);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []); // runs ONCE on mount only — no re-run on token change

  /**
   * Login user with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {object} User data on success.
   */
  const login = async (email, password) => {
    const res = await endpoints.login(email, password);
    console.log("loginRes", res);
    if (!res.success) {
      throw new Error(res.message);
    }
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  /**
   * Register a new user.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {object} User data on success.
   */
  const register = async (name, email, password) => {
    const res = await endpoints.register(name, email, password);
    console.log("registerRes", res);
    if (!res.success) {
      throw new Error(res.message);
    }
    return res.data;
  };

  /**
   * Logout user and clear session.
   */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
