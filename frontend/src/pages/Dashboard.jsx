/**
 * pages/Dashboard.jsx – User Performance Dashboard
 *
 * Displays:
 * • Welcome banner with gradient
 * • 4 stat cards (total, correct, accuracy, topics)
 * • Strong / Weak topic insight cards
 * • Line chart – 7-day activity
 * • Bar chart  – topic accuracy
 * • Doughnut   – difficulty split
 * • Topic breakdown table
 *
 * Chart.js colors automatically adapt to dark / light theme.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import endpoints from "../services/endpoints";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

/* ────────────────────────────────────────────
   Resolve CSS variable value from document
   (ensures Chart.js gets the current theme colour)
────────────────────────────────────────────── */
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [summary, setSummary] = useState(null);
  const [streak, setStreak] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    const [summaryRes, streakRes, recRes] = await Promise.all([
      endpoints.getDashboardSummary(),
      endpoints.getStreak(),
      endpoints.getRecommendations(),
    ]);

    if (!summaryRes.success) {
      setError(summaryRes.message);
      setLoading(false);
      return;
    }
    setSummary(summaryRes.data);
    if (streakRes.success) setStreak(streakRes.data);
    if (recRes.success) setRecommendations(recRes.data);
    setLoading(false);
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading dashboard…
      </div>
    );
  }

  if (error) return <div className="alert alert-error">⚠️ {error}</div>;
  if (!summary) return null;

  /* ────────────────────────────────────────
     Theme-aware colour palette for charts
  ──────────────────────────────────────── */
  const accent = isDark ? "#4C9AFF" : "#0078FF";
  const success = "#0ACF83";
  const border = isDark ? "#242438" : "#E1E4E8";
  const textMuted = isDark ? "#525F74" : "#9FACBE";
  const cardBg = isDark ? "#16162A" : "#FFFFFF";

  const multiColors = isDark
    ? ["#4C9AFF", "#0ACF83", "#FFC53D", "#FF6B6B", "#A78BFA", "#22D3EE", "#FB7185", "#FB923C"]
    : ["#0078FF", "#0ACF83", "#FAAD14", "#FF4D4F", "#7C3AED", "#0891B2", "#E11D48", "#EA580C"];

  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: textMuted, boxWidth: 12, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: isDark ? "#1C1C34" : "#FFFFFF",
        titleColor: isDark ? "#E6EAF4" : "#14142B",
        bodyColor: isDark ? "#8892A4" : "#5E6C84",
        borderColor: border,
        borderWidth: 1,
      },
    },
    scales: {
      x: { ticks: { color: textMuted, font: { size: 11 } }, grid: { color: border } },
      y: { ticks: { color: textMuted, font: { size: 11 } }, grid: { color: border } },
    },
  };

  /* ── 7-Day Activity (Line) ── */
  const activityData = {
    labels: summary.last_7_days.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: "Attempts",
        data: summary.last_7_days.map((d) => d.total),
        borderColor: accent,
        backgroundColor: isDark ? "rgba(76,154,255,0.12)" : "rgba(0,120,255,0.1)",
        fill: true,
        tension: 0.35,
        pointBackgroundColor: accent,
        pointRadius: 4,
      },
      {
        label: "Correct",
        data: summary.last_7_days.map((d) => d.correct),
        borderColor: success,
        backgroundColor: isDark ? "rgba(10,207,131,0.1)" : "rgba(10,207,131,0.08)",
        fill: true,
        tension: 0.35,
        pointBackgroundColor: success,
        pointRadius: 4,
      },
    ],
  };

  /* ── Topic Bar ── */
  const topicData = {
    labels: summary.topic_performance.map((t) => t.topic),
    datasets: [
      {
        label: "Accuracy %",
        data: summary.topic_performance.map((t) => t.accuracy),
        backgroundColor: multiColors,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  /* ── Difficulty Doughnut ── */
  const diffData = {
    labels: summary.difficulty_performance.map((d) => d.difficulty),
    datasets: [
      {
        data: summary.difficulty_performance.map((d) => d.accuracy),
        backgroundColor: [success, "#FFC53D", isDark ? "#FF6B6B" : "#FF4D4F"],
        borderColor: cardBg,
        borderWidth: 3,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: textMuted, boxWidth: 12, font: { size: 11 } },
      },
      tooltip: baseChartOptions.plugins.tooltip,
    },
  };

  const barOptions = {
    ...baseChartOptions,
    scales: {
      ...baseChartOptions.scales,
      y: { ...baseChartOptions.scales.y, beginAtZero: true, max: 100 },
    },
  };

  /* ── Accuracy colour helper ── */
  const accColor = (v) => (v >= 75 ? "var(--success)" : v >= 50 ? "var(--warning)" : "var(--danger)");

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your performance at a glance</p>
        </div>
        <Link to="/practice" className="btn btn-primary">
          ✏️ Start Practice
        </Link>
      </div>

      {/* ── Welcome Banner ── */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-title">👋 Welcome back, {user?.name}!</div>
        <p className="dashboard-welcome-sub">Keep pushing — every practice session sharpens your edge.</p>
        {streak && streak.current_streak > 0 && (
          <div className="streak-badge">
            🔥 {streak.current_streak} Day Streak!
            {streak.longest_streak > streak.current_streak && (
              <span style={{ fontSize: "0.8rem", opacity: 0.8, marginLeft: "0.5rem" }}>
                (Best: {streak.longest_streak})
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-4" style={{ marginBottom: "2rem" }}>
        <div className="stat-card">
          <span className="stat-icon">🎯</span>
          <div className="stat-value">{summary.total_attempts}</div>
          <div className="stat-label">Total Attempts</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {summary.correct_attempts}
          </div>
          <div className="stat-label">Correct Answers</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div className="stat-value" style={{ color: accColor(summary.accuracy) }}>
            {summary.accuracy}%
          </div>
          <div className="stat-label">Overall Accuracy</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📚</span>
          <div className="stat-value">{summary.topic_performance.length}</div>
          <div className="stat-label">Topics Practiced</div>
        </div>
      </div>

      {/* ── Insights ── */}
      {(summary.strong_topics.length > 0 || summary.weak_topics.length > 0) && (
        <div className="grid grid-2" style={{ marginBottom: "2rem" }}>
          <div className="insight-card">
            <div className="insight-header" style={{ color: "var(--success)" }}>
              💪 Strong Topics <small style={{ color: "var(--text-muted)", fontWeight: 400 }}>(≥ 75%)</small>
            </div>
            {summary.strong_topics.length > 0 ? (
              <ul className="insight-list">
                {summary.strong_topics.map((t) => (
                  <li key={t}>✅ {t}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                Keep practicing to build strong areas!
              </p>
            )}
          </div>
          <div className="insight-card">
            <div className="insight-header" style={{ color: "var(--danger)" }}>
              📖 Needs Work <small style={{ color: "var(--text-muted)", fontWeight: 400 }}>(&lt; 50%)</small>
            </div>
            {summary.weak_topics.length > 0 ? (
              <ul className="insight-list">
                {summary.weak_topics.map((t) => (
                  <li key={t}>🔴 {t}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                Great job! No weak topics detected.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── AI Recommendations ── */}
      {recommendations && recommendations.weak_topics && recommendations.weak_topics.length > 0 && (
        <div className="recommendation-card" style={{ marginBottom: "2rem" }}>
          <div className="recommendation-header">
            <span className="recommendation-icon">🤖</span>
            <h3>AI Recommendation</h3>
          </div>
          <p className="recommendation-text">{recommendations.suggestion}</p>
          <div className="recommendation-topics">
            {recommendations.weak_topics.map((t) => (
              <span key={t.topic} className="recommendation-topic-chip">
                {t.topic} — {t.accuracy}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-2" style={{ marginBottom: "2rem" }}>
        <div className="card">
          <div className="card-header">📅 Last 7 Days Activity</div>
          <div style={{ height: "260px" }}>
            <Line data={activityData} options={baseChartOptions} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">🏷️ Topic-wise Accuracy</div>
          <div style={{ height: "260px" }}>
            <Bar data={topicData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">🎭 Difficulty Breakdown</div>
          <div style={{ height: "260px", display: "flex", justifyContent: "center" }}>
            <Doughnut data={diffData} options={doughnutOptions} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">📋 Topic Details</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Attempted</th>
                  <th>Correct</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {summary.topic_performance.map((t) => (
                  <tr key={t.topic}>
                    <td style={{ fontWeight: 500 }}>{t.topic}</td>
                    <td>{t.total}</td>
                    <td>{t.correct}</td>
                    <td>
                      <span style={{ color: accColor(t.accuracy), fontWeight: 700 }}>{t.accuracy}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
