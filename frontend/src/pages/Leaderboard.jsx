/**
 * pages/Leaderboard.jsx – Top Users Leaderboard
 *
 * Shows ranked users by accuracy, with medals for top 3.
 */

import { useState, useEffect } from "react";
import endpoints from "../services/endpoints";
import { useAuth } from "../context/AuthContext";

const MEDAL = ["🥇", "🥈", "🥉"];

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const res = await endpoints.getLeaderboard(50);
    if (!res.success) {
      setError(res.message);
      setLoading(false);
      return;
    }
    setLeaderboard(res.data.leaderboard);
    setLoading(false);
  };

  const accColor = (v) => (v >= 75 ? "var(--success)" : v >= 50 ? "var(--warning)" : "var(--danger)");

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>Loading leaderboard…
      </div>
    );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-subtitle">Top performers ranked by accuracy (min. 5 attempts)</p>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {leaderboard.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon">🏆</span>
            <h3>No leaderboard data yet</h3>
            <p>Complete at least 5 practice attempts to appear on the leaderboard.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="leaderboard-podium">
              {[1, 0, 2].map((idx) => {
                const entry = leaderboard[idx];
                if (!entry) return null;
                return (
                  <div key={entry.user_id} className={`podium-card podium-${entry.rank}`}>
                    <div className="podium-medal">{MEDAL[entry.rank - 1]}</div>
                    <div className="podium-avatar">{entry.username?.[0]?.toUpperCase() ?? "U"}</div>
                    <div className="podium-name">{entry.username}</div>
                    <div className="podium-accuracy" style={{ color: accColor(entry.accuracy) }}>
                      {entry.accuracy}%
                    </div>
                    <div className="podium-attempts">
                      {entry.correct}/{entry.total_attempts} correct
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>User</th>
                    <th>Accuracy</th>
                    <th>Correct</th>
                    <th>Total Attempts</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr key={entry.user_id} className={entry.user_id === user?.id ? "highlight-row" : ""}>
                      <td>
                        <span style={{ fontWeight: 700 }}>
                          {entry.rank <= 3 ? MEDAL[entry.rank - 1] : `#${entry.rank}`}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, var(--accent), #7C3AED)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {entry.username?.[0]?.toUpperCase() ?? "U"}
                          </div>
                          <span style={{ fontWeight: 500 }}>
                            {entry.username}
                            {entry.user_id === user?.id && (
                              <span style={{ color: "var(--accent)", fontSize: "0.75rem", marginLeft: "0.5rem" }}>
                                (You)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: accColor(entry.accuracy) }}>{entry.accuracy}%</span>
                      </td>
                      <td>{entry.correct}</td>
                      <td>{entry.total_attempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
