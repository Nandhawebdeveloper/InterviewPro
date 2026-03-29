/**
 * pages/Bookmarks.jsx – Saved Questions Page
 *
 * Shows all bookmarked questions with remove option.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import endpoints from "../services/endpoints";

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    const res = await endpoints.getBookmarks();

    // For debug display in component (as requested) in attached format style:
    console.log("📤 API response:", res);

    if (!res.success) {
      setError(res.message);
      setLoading(false);
      return;
    }
    setBookmarks(res.data.bookmarks);
    setLoading(false);
  };

  const handleRemove = async (bookmarkId) => {
    const res = await endpoints.removeBookmark(bookmarkId);
    console.log("Remove bookmark response:", res);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  };

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>Loading bookmarks…
      </div>
    );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookmarked Questions</h1>
          <p className="page-subtitle">
            {bookmarks.length} saved question{bookmarks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/practice" className="btn btn-primary">
          ✏️ Practice Mode
        </Link>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {bookmarks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon">🔖</span>
            <h3>No bookmarks yet</h3>
            <p>Save questions during practice to review them later.</p>
          </div>
        </div>
      ) : (
        <div className="bookmark-grid">
          {bookmarks.map((b) => {
            const q = b.question;
            if (!q) return null;
            return (
              <div className="card bookmark-card" key={b.id}>
                <div className="question-meta">
                  <span className={`badge badge-${q.type.toLowerCase()}`}>{q.type}</span>
                  <span className={`badge badge-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                  <span className="badge" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                    {q.topic}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "0.5rem",
                    lineHeight: 1.5,
                  }}
                >
                  {q.title}
                </h3>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    lineHeight: 1.6,
                    marginBottom: "1rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {q.description}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Saved {new Date(b.created_at).toLocaleDateString()}
                  </span>
                  <button className="btn btn-outline btn-sm" onClick={() => handleRemove(b.id)}>
                    🗑️ Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
