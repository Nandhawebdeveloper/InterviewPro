/**
 * components/Navbar.jsx – Sticky Navigation Bar
 *
 * Features:
 * • Glassmorphism backdrop-blur effect
 * • Active link detection via useLocation
 * • Dark / light mode toggle (reads from ThemeContext)
 * • User avatar + admin chip
 * • Logout button
 */

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LogoIcon from "./LogoIcon";

const Navbar = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* ─── Menu Toggle (mobile) ─── */}
        {user && (
          <button className="menu-toggle" onClick={onMenuToggle} aria-label="Toggle sidebar">
            <span className="menu-toggle-bar"></span>
            <span className="menu-toggle-bar"></span>
            <span className="menu-toggle-bar"></span>
          </button>
        )}

        {/* ─── Logo ─── */}
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon">
            <LogoIcon size={18} />
          </span>
          <span className="navbar-logo-text">
            Interview<span>Pro</span>
          </span>
        </Link>

        {/* ─── Right side ─── */}
        <div className="navbar-right">
          {/* Theme toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {user ? null : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
