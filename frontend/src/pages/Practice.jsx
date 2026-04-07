/**
 * pages/Practice.jsx – Quiz Practice Mode
 *
 * Features:
 * • Filter by topic, difficulty, question type
 * • Search by keyword
 * • Smart filtering: exclude already-solved questions toggle
 * • Labels: "New Question" / "Previously Attempted" / "AI Generated"
 * • AI Question Generator (template-based + OpenAI-powered)
 * • Daily AI usage counter (5/day limit)
 * • Fallback system when AI fails or limit reached
 * • Bookmark questions
 * • Animated progress bar
 * • Score pill in header
 * • Next / Previous navigation
 * • Result feedback via QuestionCard
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import Switch from "react-switch";
import endpoints from "../services/endpoints";
import QuestionCard from "../components/QuestionCard";
import Discussions from "../components/Discussions";

const aiGeneratorSchema = Yup.object({
  topic: Yup.string().required("Topic is required"),
  difficulty: Yup.string().oneOf(["Easy", "Medium", "Hard"]).required("Difficulty is required"),
  type: Yup.string().oneOf(["MCQ", "CODING"]).required("Type is required"),
});

const Practice = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Filters */
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [type, setType] = useState("");
  const [search, setSearch] = useState("");
  const [topics, setTopics] = useState([]);
  const [excludeSolved, setExcludeSolved] = useState(true);

  /* Per-question state */
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  /* Bookmarks */
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  /* Solved question IDs */
  const [solvedIds, setSolvedIds] = useState(new Set());

  /* AI Generator */
  const [showGenerator, setShowGenerator] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [aiUsage, setAiUsage] = useState({ used: 0, limit: 5, remaining: 5 });
  const [genMode, setGenMode] = useState("ai"); // "ai" or "template"

  useEffect(() => {
    fetchTopics();
    fetchQuestions();
    fetchBookmarks();
    fetchAIUsage();
  }, []);

  const fetchTopics = async () => {
    const res = await endpoints.getTopics();
    if (res.success) setTopics(res.data.topics);
  };

  const fetchBookmarks = async () => {
    const res = await endpoints.getBookmarks();
    if (res.success) {
      const ids = new Set(res.data.bookmarks.map((b) => b.question_id));
      setBookmarkedIds(ids);
    }
  };

  const fetchAIUsage = async () => {
    const res = await endpoints.getAIUsage();
    if (res.success) {
      setAiUsage(res.data);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setError("");
    const params = { per_page: 10, randomize: "true" };
    if (topic) params.topic = topic;
    if (difficulty) params.difficulty = difficulty;
    if (type) params.type = type;
    if (search.trim()) params.search = search.trim();
    if (excludeSolved) params.exclude_solved = "true";

    const res = await endpoints.getQuestions(params);
    if (!res.success) {
      setError(res.message);
      setLoading(false);
      return;
    }
    setQuestions(res.data.questions);
    if (res.data.solved_ids) {
      setSolvedIds(new Set(res.data.solved_ids));
    }
    setCurrentIndex(0);
    resetQuestion();
    setLoading(false);
  };

  const resetQuestion = () => {
    setSelectedAnswer("");
    setSubmitted(false);
    setResult(null);
  };

  const handleFilter = () => {
    setScore({ correct: 0, total: 0 });
    fetchQuestions();
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) return;
    const currentQuestion = questions[currentIndex];
    const res = await endpoints.submitAttempt(currentQuestion.id, selectedAnswer);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setResult(res.data);
    setSubmitted(true);
    setScore((prev) => ({
      correct: prev.correct + (res.data.is_correct ? 1 : 0),
      total: prev.total + 1,
    }));
    // Mark as solved
    setSolvedIds((prev) => new Set(prev).add(currentQuestion.id));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      resetQuestion();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      resetQuestion();
    }
  };

  const toggleBookmark = async (questionId) => {
    if (bookmarkedIds.has(questionId)) {
      const res = await endpoints.removeBookmarkByQuestion(questionId);
      if (res.success) {
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(questionId);
          return next;
        });
      }
    } else {
      const res = await endpoints.addBookmark(questionId);
      if (res.success) {
        setBookmarkedIds((prev) => new Set(prev).add(questionId));
      }
    }
  };

  const handleGenerate = async (values, { setSubmitting }) => {
    setGenResult(null);
    setError("");

    let res;
    if (genMode === "ai") {
      res = await endpoints.aiGenerateQuestion(values.topic, values.difficulty, values.type);
      console.log("AI Generation response:", res);
    } else {
      res = await endpoints.generateQuestion(values.topic, values.difficulty, values.type);
      console.log("Template Generation response:", res);
    }

    if (!res.success) {
      setError(res.message);
      setSubmitting(false);
      return;
    }

    setGenResult(res.data);
    setSubmitting(false);

    // Update AI usage if returned
    if (res.data.usage) {
      setAiUsage(res.data.usage);
    }

    fetchQuestions();
  };

  const currentQuestion = questions[currentIndex];
  const progressPct = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Practice Mode</h1>
          <p className="page-subtitle">Filter, attempt, and track your answers</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {score.total > 0 && (
            <div className="score-pill">
              🏆 Score: {score.correct}/{score.total} &nbsp;
              <span style={{ color: score.correct / score.total >= 0.6 ? "var(--success)" : "var(--danger)" }}>
                ({Math.round((score.correct / score.total) * 100)}%)
              </span>
            </div>
          )}
          <button className="btn btn-outline" onClick={() => setShowGenerator(!showGenerator)}>
            🤖 {showGenerator ? "Hide" : "AI Generate"}
          </button>
        </div>
      </div>

      {/* ── AI Question Generator ── */}
      {showGenerator && (
        <div className="card ai-generator-card" style={{ marginBottom: "1.5rem" }}>
          <div
            className="card-header"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span>🤖 AI Question Generator</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* AI Usage Counter */}
              <span
                style={{
                  fontSize: "0.8rem",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "12px",
                  background: aiUsage.remaining > 0 ? "rgba(99, 102, 241, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  color: aiUsage.remaining > 0 ? "var(--primary)" : "var(--danger)",
                  fontWeight: 600,
                }}
              >
                ⚡ {aiUsage.remaining}/{aiUsage.limit} AI left today
              </span>
              {/* Mode Toggle */}
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <button
                  type="button"
                  className={`btn ${genMode === "ai" ? "btn-primary" : "btn-outline"}`}
                  style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                  onClick={() => setGenMode("ai")}
                >
                  🧠 AI (OpenAI)
                </button>
                <button
                  type="button"
                  className={`btn ${genMode === "template" ? "btn-primary" : "btn-outline"}`}
                  style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                  onClick={() => setGenMode("template")}
                >
                  📋 Template
                </button>
              </div>
            </div>
          </div>
          <Formik
            initialValues={{ topic: "JavaScript", difficulty: "Medium", type: "MCQ" }}
            validationSchema={aiGeneratorSchema}
            onSubmit={handleGenerate}
          >
            {({ isSubmitting }) => (
              <Form>
                <div className="filters" style={{ marginBottom: "1rem" }}>
                  <Field name="topic" as="select" className="form-control">
                    {[
                      "JavaScript",
                      "React",
                      "Python",
                      "SQL",
                      "DSA",
                      "Database",
                      "Node.js",
                      "TypeScript",
                      "HTML/CSS",
                      "System Design",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Field>
                  <Field name="difficulty" as="select" className="form-control">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </Field>
                  <Field name="type" as="select" className="form-control">
                    <option value="MCQ">MCQ</option>
                    <option value="CODING">Coding</option>
                  </Field>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || (genMode === "ai" && aiUsage.remaining <= 0)}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }}></span>
                        Generating…
                      </>
                    ) : genMode === "ai" && aiUsage.remaining <= 0 ? (
                      "🚫 Limit Reached"
                    ) : (
                      "✨ Generate"
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          {/* ── Generated Result ── */}
          {genResult && (
            <div className="gen-result" style={{ marginTop: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                <span className={`badge badge-${(genResult.type || "mcq").toLowerCase()}`}>
                  {genResult.type || "MCQ"}
                </span>
                <span className={`badge badge-${(genResult.difficulty || "medium").toLowerCase()}`}>
                  {genResult.difficulty || "Medium"}
                </span>
                {genResult.is_ai_generated && (
                  <span
                    className="badge"
                    style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", color: "#fff" }}
                  >
                    🧠 AI Generated
                  </span>
                )}
                {genResult.is_fallback && (
                  <span className="badge" style={{ background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}>
                    📦 Fallback
                  </span>
                )}
              </div>
              <h4 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>{genResult.title}</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                {genResult.explanation || genResult.description}
              </p>

              {genResult.options && (
                <div style={{ marginTop: "0.75rem" }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>Options:</p>
                  <ul
                    style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.35rem" }}
                  >
                    {genResult.options.map((opt, idx) => {
                      const isCorrect = opt === genResult.correct_answer;
                      const letter = String.fromCharCode(65 + idx);
                      const truncated = opt.length > 80 ? opt.slice(0, 80) + "…" : opt;
                      return (
                        <li
                          key={idx}
                          style={{
                            padding: "0.5rem 0.75rem",
                            borderRadius: "8px",
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.5rem",
                            background: isCorrect ? "rgba(34, 197, 94, 0.1)" : "var(--bg-secondary)",
                            color: isCorrect ? "var(--success)" : "var(--text-secondary)",
                            border: isCorrect ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid transparent",
                          }}
                        >
                          <span
                            style={{
                              minWidth: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              flexShrink: 0,
                              background: isCorrect ? "rgba(34, 197, 94, 0.2)" : "var(--bg-tertiary)",
                              color: isCorrect ? "var(--success)" : "var(--text-secondary)",
                            }}
                          >
                            {isCorrect ? "✓" : letter}
                          </span>
                          <span style={{ lineHeight: 1.4 }} title={opt.length > 80 ? opt : undefined}>
                            {truncated}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {genResult.already_existed && (
                <p style={{ color: "var(--warning)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                  ℹ️ This question already existed in the bank.
                </p>
              )}
              {genResult.fallback_reason === "daily_limit" && (
                <p style={{ color: "var(--warning)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                  ⚠️ Daily AI limit reached. Showing a question from the bank.
                </p>
              )}
              {/* {genResult.fallback_reason === "ai_error" && (
                <p style={{ color: "var(--warning)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                  ⚠️ AI service unavailable. Showing a fallback question from the bank.
                </p>
              )} */}
            </div>
          )}
        </div>
      )}

      {/* ── Filters & Search ── */}
      <div className="filters">
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFilter()}
          style={{ minWidth: "200px" }}
        />

        <select className="form-control" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">All Topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select className="form-control" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="MCQ">MCQ</option>
          <option value="CODING">Coding</option>
        </select>

        <button className="btn btn-primary" onClick={handleFilter}>
          🔍 Apply Filters
        </button>
      </div>

      {/* ── Exclude Solved Toggle ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.75rem 0 0.5rem" }}>
        <label
          htmlFor="include-solved-switch"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            cursor: "pointer",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          <Switch
            id="include-solved-switch"
            checked={!excludeSolved}
            onChange={(checked) => setExcludeSolved(!checked)}
            onColor="#6366f1"
            offColor="#d1d5db"
            onHandleColor="#fff"
            offHandleColor="#fff"
            handleDiameter={18}
            uncheckedIcon={false}
            checkedIcon={false}
            height={22}
            width={42}
            activeBoxShadow="0 0 2px 3px rgba(99, 102, 241, 0.3)"
          />
          Include Solved Questions
        </label>
        <button
          className="btn btn-outline"
          style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
          onClick={handleFilter}
        >
          Refresh
        </button>
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Loading questions…
        </div>
      )}

      {error && (
        <div
          className="alert alert-error"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError("")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "1.1rem" }}
          >
            ✕
          </button>
        </div>
      )}

      {!loading && questions.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <h3>No questions found</h3>
            <p>
              {excludeSolved
                ? "All questions solved! Toggle 'Include Solved Questions' or try different filters."
                : "Try changing your filters or ask an admin to add questions."}
            </p>
          </div>
        </div>
      )}

      {/* ── Question Display ── */}
      {!loading && currentQuestion && (
        <div className="question-container">
          {/* Progress bar */}
          <div className="question-progress-bar">
            <div className="question-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          {/* Counter + Labels + Bookmark */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <p className="question-number">
                Question {currentIndex + 1} of {questions.length}
              </p>
              {/* Question Status Labels */}
              {solvedIds.has(currentQuestion.id) || currentQuestion.is_attempted ? (
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "10px",
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    fontWeight: 600,
                  }}
                >
                  Previously Attempted
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "10px",
                    background: "rgba(34, 197, 94, 0.15)",
                    color: "#22c55e",
                    fontWeight: 600,
                  }}
                >
                  New Question
                </span>
              )}
              {currentQuestion.is_ai_generated && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.15))",
                    color: "#8b5cf6",
                    fontWeight: 600,
                  }}
                >
                  🧠 AI Generated
                </span>
              )}
            </div>
            <button
              className={`bookmark-btn ${bookmarkedIds.has(currentQuestion.id) ? "bookmarked" : ""}`}
              onClick={() => toggleBookmark(currentQuestion.id)}
              title={bookmarkedIds.has(currentQuestion.id) ? "Remove bookmark" : "Bookmark this question"}
            >
              {bookmarkedIds.has(currentQuestion.id) ? "🔖" : "📑"}
            </button>
          </div>

          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={setSelectedAnswer}
            submitted={submitted}
            result={result}
            showAnswer={solvedIds.has(currentQuestion.id) || currentQuestion.is_attempted}
          />

          {/* ── Action Row ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1.5rem",
              gap: "0.75rem",
            }}
          >
            <button className="btn btn-outline" onClick={handlePrevious} disabled={currentIndex === 0}>
              ← Previous
            </button>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              {!submitted ? (
                <button className="btn btn-primary" onClick={handleSubmit} disabled={!selectedAnswer}>
                  Submit Answer ✓
                </button>
              ) : currentIndex < questions.length - 1 ? (
                <button className="btn btn-success" onClick={handleNext}>
                  Next Question →
                </button>
              ) : (
                <span style={{ color: "var(--success)", fontWeight: 600, fontSize: "0.95rem" }}>
                  ✅ All questions done!
                </span>
              )}
            </div>
          </div>

          {/* ── Session Complete Banner ── */}
          {submitted && currentIndex === questions.length - 1 && (
            <div className="session-complete-banner">
              <div className="session-complete-icon">
                {score.total > 0 && score.correct / score.total >= 0.8
                  ? "🏆"
                  : score.total > 0 && score.correct / score.total >= 0.5
                    ? "👍"
                    : "📚"}
              </div>
              <h2 className="session-complete-title">Session Complete!</h2>
              <p className="session-complete-sub">
                You've worked through all <strong>{questions.length}</strong> question
                {questions.length !== 1 ? "s" : ""} in this set.
              </p>
              {score.total > 0 && (
                <div className="session-complete-score">
                  <span className="score-big">{score.correct}</span>
                  <span className="score-sep"> / {score.total} correct</span>
                  <span
                    className="score-pct"
                    style={{ color: score.correct / score.total >= 0.6 ? "var(--success)" : "var(--danger)" }}
                  >
                    {Math.round((score.correct / score.total) * 100)}%
                  </span>
                </div>
              )}
              <div className="session-complete-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setScore({ correct: 0, total: 0 });
                    fetchQuestions();
                  }}
                >
                  🔄 Practice Again
                </button>
                <Link to="/bookmarks" className="btn btn-outline">
                  🔖 Bookmarks
                </Link>
                <Link to="/leaderboard" className="btn btn-outline">
                  🥇 Leaderboard
                </Link>
                <Link to="/mock-interview" className="btn btn-outline">
                  🎤 Mock Interview
                </Link>
              </div>
              <p className="session-hint">💡 Change the filters above to explore a different set of questions.</p>
            </div>
          )}

          {/* ── Discussion ── */}
          <div style={{ marginTop: "2rem" }}>
            <Discussions questionId={currentQuestion.id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Practice;
