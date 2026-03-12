/**
 * components/ProtectedRoute.jsx - Route Guard Component
 *
 * Wraps routes that require authentication or admin privileges.
 * Redirects unauthenticated users to the login page.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute - Restricts access based on auth status and role.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to render.
 * @param {boolean} props.adminOnly - If true, restricts to admin users.
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Authenticating...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect non-admin users from admin routes
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
