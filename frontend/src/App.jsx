/**
 * App.jsx - Root Application Component
 *
 * Defines the application routing structure with protected routes,
 * role-based access, sidebar navigation, and layout components.
 */

import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Layout
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import IdleWarning from "./components/IdleWarning";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Bookmarks from "./pages/Bookmarks";
import CodeEditor from "./pages/CodeEditor";
import StudyRoadmap from "./pages/StudyRoadmap";
import MockInterview from "./pages/MockInterview";
import Badges from "./pages/Badges";
import Pricing from "./pages/Pricing";

const AppInner = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: "100vh" }}>
        <div className="spinner"></div>
        Loading InterviewPro...
      </div>
    );
  }

  return (
    <div className="app-container">
      {isAuthenticated && <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />}

      {/* Idle timeout warning - shows globally when user is about to be logged out */}
      {isAuthenticated && <IdleWarning />}

      <div className={isAuthenticated ? "app-body" : ""}>
        {isAuthenticated && <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />}

        <div className={isAuthenticated ? "main-content" : ""}>
          <Routes>
            {/* ---- Public Routes ---- */}
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Home />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />

            {/* ---- Protected User Routes ---- */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/practice"
              element={
                <ProtectedRoute>
                  <Practice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookmarks"
              element={
                <ProtectedRoute>
                  <Bookmarks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/code-editor"
              element={
                <ProtectedRoute>
                  <CodeEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roadmap"
              element={
                <ProtectedRoute>
                  <StudyRoadmap />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mock-interview"
              element={
                <ProtectedRoute>
                  <MockInterview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/badges"
              element={
                <ProtectedRoute>
                  <Badges />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <Pricing />
                </ProtectedRoute>
              }
            />

            {/* ---- Protected Admin Routes ---- */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            {/* ---- Default Redirect ---- */}
            <Route path="/home" element={<Navigate to="/" />} />

            {/* ---- 404 Catch-all ---- */}
            <Route
              path="*"
              element={
                <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                  <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>404</h1>
                  <p style={{ color: "var(--text-secondary)" }}>Page not found</p>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <ThemeProvider>
    <AppInner />
  </ThemeProvider>
);

export default App;
