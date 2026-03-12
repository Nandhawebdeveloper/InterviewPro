import { useState, useEffect, useRef, useCallback } from "react";
import endpoints from "../services/endpoints";

const MockInterview = () => {
  const [stage, setStage] = useState("setup"); // setup | interview | result
  const [config, setConfig] = useState({ count: 10, difficulty: "", topic: "", time_limit: 1800 });
  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  // Timer
  useEffect(() => {
    if (stage !== "interview" || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [stage]);

  const loadHistory = async () => {
    const res = await endpoints.getInterviewHistory();
    if (res.success) setHistory(res.data.interviews || []);
  };

  const handleStart = async () => {
    setLoading(true);
    const res = await endpoints.startInterview(config);
    if (res.success) {
      setInterviewId(res.data.interview_id);
      setQuestions(res.data.questions || []);
      setTimeLeft(res.data.time_limit || 1800);
      setAnswers({});
      setCurrentIdx(0);
      setStage("interview");
    }
    setLoading(false);
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    if (!interviewId) return;
    clearInterval(timerRef.current);
    setLoading(true);
    const res = await endpoints.submitInterview(interviewId, answers);
    if (res.success) {
      setResult(res.data);
      setStage("result");
      loadHistory();
    }
    setLoading(false);
  }, [interviewId, answers]);

  const handleContinue = async (id) => {
    setLoading(true);
    const res = await endpoints.resumeInterview(id);
    if (res.success) {
      const data = res.data;
      setInterviewId(data.interview_id);
      setQuestions(data.questions || []);
      setAnswers(data.answers || {});
      setTimeLeft(data.time_remaining);
      // Resume from first unanswered question
      const firstUnanswered = data.questions.findIndex((q) => !data.answers?.[String(q.id)]);
      setCurrentIdx(firstUnanswered >= 0 ? firstUnanswered : 0);
      setStage("interview");
    } else {
      alert(res.message || "Could not resume interview.");
      loadHistory();
    }
    setLoading(false);
  };

  const handleDiscard = async (id) => {
    if (!window.confirm("Discard this in-progress interview?")) return;
    const res = await endpoints.deleteInterview(id);
    if (res.success) loadHistory();
  };

  const handleViewResult = async (id) => {
    setLoading(true);
    const res = await endpoints.getInterviewResult(id);
    if (res.success) {
      setResult(res.data);
      setStage("result");
    }
    setLoading(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentIdx];

  // ─── SETUP ───
  if (stage === "setup") {
    return (
      <div className="mock-interview-page">
        <div className="page-header">
          <h1>🎤 Mock Interview</h1>
          <p className="text-secondary">Simulate a real interview with timed questions and scoring</p>
        </div>

        <div className="interview-setup card">
          <h2>Configure Your Interview</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Number of Questions</label>
              <select
                className="form-control"
                value={config.count}
                onChange={(e) => setConfig({ ...config, count: +e.target.value })}
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} Questions
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Time Limit</label>
              <select
                className="form-control"
                value={config.time_limit}
                onChange={(e) => setConfig({ ...config, time_limit: +e.target.value })}
              >
                <option value={600}>10 Minutes</option>
                <option value={900}>15 Minutes</option>
                <option value={1800}>30 Minutes</option>
                <option value={3600}>60 Minutes</option>
              </select>
            </div>
            <div className="form-group">
              <label>Difficulty (Optional)</label>
              <select
                className="form-control"
                value={config.difficulty}
                onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="form-group">
              <label>Topic (Optional)</label>
              <input
                className="form-control"
                placeholder="e.g. React, Python, SQL"
                value={config.topic}
                onChange={(e) => setConfig({ ...config, topic: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={loading}>
            {loading ? "Starting..." : "🚀 Start Interview"}
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="interview-history">
            <h2>📋 Interview History</h2>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Questions</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((iv) => {
                    const elapsed = (Date.now() - new Date(iv.started_at).getTime()) / 1000;
                    const isExpired = iv.status !== "completed" && elapsed > (iv.time_limit || 1800);
                    return (
                      <tr key={iv.id}>
                        <td>{new Date(iv.started_at).toLocaleDateString()}</td>
                        <td>{iv.total}</td>
                        <td>
                          {iv.score}/{iv.total}
                        </td>
                        <td>
                          <span
                            className={`badge ${iv.percentage >= 70 ? "badge-success" : iv.percentage >= 40 ? "badge-warning" : "badge-danger"}`}
                          >
                            {iv.percentage}%
                          </span>
                        </td>
                        <td>
                          {iv.status === "completed" ? (
                            <span className="badge badge-success">completed</span>
                          ) : isExpired ? (
                            <span className="badge badge-danger">⏰ Time Over</span>
                          ) : (
                            <span className="badge badge-warning">{iv.status}</span>
                          )}
                        </td>
                        <td>
                          {iv.status === "completed" ? (
                            <button className="btn btn-sm btn-outline" onClick={() => handleViewResult(iv.id)}>
                              📊 View
                            </button>
                          ) : isExpired ? (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDiscard(iv.id)}
                              title="Discard this expired session"
                            >
                              🗑 Discard
                            </button>
                          ) : (
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleContinue(iv.id)}
                                title="Resume this interview"
                              >
                                ▶ Continue
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDiscard(iv.id)}
                                title="Discard this incomplete session"
                              >
                                🗑
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── INTERVIEW ───
  if (stage === "interview") {
    return (
      <div className="mock-interview-page">
        {/* Timer bar */}
        <div className="interview-timer-bar">
          <div className="interview-timer-info">
            <span>
              Question {currentIdx + 1} of {questions.length}
            </span>
            <span
              className={`interview-timer ${timeLeft < 60 ? "timer-danger" : timeLeft < 300 ? "timer-warning" : ""}`}
            >
              ⏱ {formatTime(timeLeft)}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        {currentQ && (
          <div className="interview-question card">
            <div className="interview-question-header">
              <span className={`badge badge-${currentQ.difficulty?.toLowerCase()}`}>{currentQ.difficulty}</span>
              <span className="badge">{currentQ.type}</span>
              {currentQ.topic && <span className="badge badge-outline">{currentQ.topic}</span>}
            </div>
            <h2>{currentQ.title}</h2>
            <p className="text-secondary">{currentQ.description}</p>

            {/* MCQ Options */}
            {currentQ.type === "MCQ" && currentQ.options && (
              <div className="interview-options">
                {currentQ.options.map((opt, i) => (
                  <button
                    key={i}
                    className={`interview-option ${answers[currentQ.id] === opt ? "interview-option-selected" : ""}`}
                    onClick={() => handleAnswer(currentQ.id, opt)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Coding answer */}
            {currentQ.type === "CODING" && (
              <textarea
                className="form-control"
                rows={4}
                placeholder="Type your answer..."
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
              />
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="interview-nav">
          <button
            className="btn btn-outline"
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
          >
            ← Previous
          </button>

          {/* Question dots */}
          <div className="interview-dots">
            {questions.map((q, i) => (
              <button
                key={i}
                className={`interview-dot ${i === currentIdx ? "interview-dot-active" : ""} ${answers[q.id] ? "interview-dot-answered" : ""}`}
                onClick={() => setCurrentIdx(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {currentIdx < questions.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setCurrentIdx(currentIdx + 1)}>
              Next →
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "📝 Submit Interview"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── RESULT ───
  if (stage === "result" && result) {
    return (
      <div className="mock-interview-page">
        <div className="page-header">
          <h1>📊 Interview Results</h1>
        </div>

        <div className="interview-result-summary">
          <div className="result-score-circle">
            <div
              className={`score-ring ${result.percentage >= 70 ? "score-great" : result.percentage >= 40 ? "score-ok" : "score-low"}`}
            >
              <span className="score-number">{result.percentage}%</span>
              <span className="score-label">
                {result.score}/{result.total}
              </span>
            </div>
          </div>
          <div className="result-stats">
            <div className="stat-item">
              <span className="stat-value">{result.total}</span>
              <span className="stat-label">Total Questions</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-success">{result.score}</span>
              <span className="stat-label">Correct</span>
            </div>
            <div className="stat-item">
              <span className="stat-value text-danger">{result.total - result.score}</span>
              <span className="stat-label">Incorrect</span>
            </div>
          </div>
        </div>

        {/* Detailed results */}
        <div className="interview-result-details">
          <h2>Detailed Review</h2>
          {result.results?.map((r, i) => (
            <div key={i} className={`result-item card ${r.is_correct ? "result-correct" : "result-incorrect"}`}>
              <div className="result-item-header">
                <span>
                  {r.is_correct ? "✅" : "❌"} Q{i + 1}. {r.title}
                </span>
                <div>
                  <span className={`badge badge-${r.difficulty?.toLowerCase()}`}>{r.difficulty}</span>
                  <span className="badge">{r.type}</span>
                </div>
              </div>
              <div className="result-item-answers">
                <p>
                  <strong>Your answer:</strong> {r.user_answer || "(no answer)"}
                </p>
                <p>
                  <strong>Correct answer:</strong> {r.correct_answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="interview-result-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setStage("setup");
              setResult(null);
            }}
          >
            🔄 New Interview
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default MockInterview;
