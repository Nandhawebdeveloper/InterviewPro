/**
 * components/Sidebar.jsx – Sidebar Navigation
 *
 * Responsive sidebar with icon + label navigation.
 * Collapses on mobile with hamburger toggle.
 */

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ isOpen, onToggle }) => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : "U";

  const links = [
    { to: "/dashboard", icon: "📊", label: "Dashboard" },
    { to: "/practice", icon: "✏️", label: "Practice" },
    { to: "/code-editor", icon: "💻", label: "Code Editor" },
    { to: "/mock-interview", icon: "🎤", label: "Mock Interview" },
    { to: "/roadmap", icon: "🗺️", label: "Study Roadmap" },
    { to: "/bookmarks", icon: "🔖", label: "Bookmarks" },
    { to: "/badges", icon: "🏆", label: "Badges" },
    { to: "/leaderboard", icon: "🥇", label: "Leaderboard" },
  ];

  if (isAdmin) {
    links.push({ to: "/admin", icon: "⚙️", label: "Admin Panel" });
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onToggle} />}

      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            {links.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                onClick={() => {
                  if (window.innerWidth < 768) onToggle();
                }}
              >
                <span className="sidebar-link-icon">{icon}</span>
                <span className="sidebar-link-label">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ── User footer + Logout ── */}
        <div className="sidebar-footer">
          <NavLink to="/profile" className="sidebar-user" title="View Profile">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name || "User"}</span>
              <span className="sidebar-user-role">{isAdmin ? "Admin" : "Member"}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="sidebar-user-chevron"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </NavLink>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign out">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="sidebar-logout-text">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
