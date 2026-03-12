/**
 * pages/Practice.jsx – Quiz Practice Mode
 *
 * Features:
 * • Filter by topic, difficulty, question type
 * • Search by keyword
 * • AI Question Generator
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

  /* Per-question state */
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  /* Bookmarks */
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  /* AI Generator */
  const [showGenerator, setShowGenerator] = useState(false);
  const [genResult, setGenResult] = useState(null);

  useEffect(() => {
    fetchTopics();
    fetchQuestions();
    fetchBookmarks();
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

  const fetchQuestions = async () => {
    setLoading(true);
    setError("");
    const params = { per_page: 50 };
    if (topic) params.topic = topic;
    if (difficulty) params.difficulty = difficulty;
    if (type) params.type = type;
    if (search.trim()) params.search = search.trim();

    const res = await endpoints.getQuestions(params);
    if (!res.success) {
      setError(res.message);
      setLoading(false);
      return;
    }
    setQuestions(res.data.questions);
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
    const res = await endpoints.generateQuestion(values.topic, values.difficulty, values.type);
    if (!res.success) {
      setError(res.message);
      setSubmitting(false);
      return;
    }
    setGenResult(res.data);
    setSubmitting(false);
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
          <div className="card-header">🤖 AI Question Generator</div>
          <Formik
            initialValues={{ topic: "JavaScript", difficulty: "Medium", type: "MCQ" }}
            validationSchema={aiGeneratorSchema}
            onSubmit={handleGenerate}
          >
            {({ isSubmitting, values }) => (
              <Form>
                <div className="filters" style={{ marginBottom: "1rem" }}>
                  <Field name="topic" as="select" className="form-control">
                    {["JavaScript", "React", "Python", "SQL", "DSA", "Database"].map((t) => (
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
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "Generating…" : "✨ Generate"}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
          {genResult && (
            <div className="gen-result">
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span className={`badge badge-${(genResult.type || "mcq").toLowerCase()}`}>
                  {genResult.type || "MCQ"}
                </span>
                <span className={`badge badge-${(genResult.difficulty || "medium").toLowerCase()}`}>
                  {genResult.difficulty || "Medium"}
                </span>
              </div>
              <h4 style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>{genResult.title}</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                {genResult.explanation || genResult.description}
              </p>
              {genResult.already_existed && (
                <p style={{ color: "var(--warning)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                  ℹ️ This question already existed in the bank.
                </p>
              )}
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

      {/* ── States ── */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          Loading questions…
        </div>
      )}

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {!loading && questions.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <h3>No questions found</h3>
            <p>Try changing your filters or ask an admin to add questions.</p>
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

          {/* Counter + Bookmark */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p className="question-number">
              Question {currentIndex + 1} of {questions.length}
            </p>
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
