/**
 * pages/AdminPanel.jsx – Admin Dashboard & Management
 *
 * Tabs:
 *   Analytics  — system-wide stats + topic distribution
 *   Questions  — full CRUD with modal form
 *   Users      — view all users + delete non-admins
 *
 * Uses the new tab-btn / tabs-bar classes and
 * all new card / badge / table styles from index.css.
 */

import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import * as Yup from "yup";
import endpoints from "../services/endpoints";

const questionSchema = Yup.object({
  title: Yup.string().trim().required("Title is required"),
  description: Yup.string().trim().required("Description is required"),
  type: Yup.string().oneOf(["MCQ", "CODING"], "Invalid question type").required("Type is required"),
  difficulty: Yup.string().oneOf(["Easy", "Medium", "Hard"], "Invalid difficulty").required("Difficulty is required"),
  topic: Yup.string().trim().required("Topic is required"),
  options: Yup.array().when("type", {
    is: "MCQ",
    then: (schema) =>
      schema
        .of(Yup.string())
        .test(
          "min-options",
          "At least 2 non-empty options are required for MCQ",
          (opts) => opts && opts.filter((o) => o && o.trim()).length >= 2,
        ),
    otherwise: (schema) => schema.nullable(),
  }),
  correct_answer: Yup.string().trim().required("Correct answer is required"),
});

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "MCQ",
  difficulty: "Easy",
  topic: "",
  options: ["", "", "", ""],
  correct_answer: "",
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("analytics");

  /* Data */
  const [analytics, setAnalytics] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);

  /* Sorting */
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    const valA = a[sortBy] ?? "";
    const valB = b[sortBy] ?? "";
    const cmp =
      typeof valA === "number" ? valA - valB : String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span style={{ opacity: 0.3, marginLeft: "4px" }}>⇅</span>;
    return <span style={{ marginLeft: "4px" }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  /* Modal */
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [modalInitialValues, setModalInitialValues] = useState(EMPTY_FORM);

  /* UI state */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Auto-clear messages */
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(""), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    if (activeTab === "analytics") fetchAnalytics();
    if (activeTab === "questions") fetchQuestions();
    if (activeTab === "users") fetchUsers();
  }, [activeTab]);

  /* ────────────────── API calls ────────────────── */
  const fetchAnalytics = async () => {
    setLoading(true);
    const res = await endpoints.getAdminAnalytics();
    if (!res.success) {
      setError(res.message);
      setLoading(false);
      return;
    }
    setAnalytics(res.data);
    setLoading(false);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    const res = await endpoints.getQuestions({ per_page: 100 });
    if (!res.success) {
      setError(res.message);
      setLoading(false);
      return;
    }
    setQuestions(res.data.questions);
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const res = await endpoints.getAllUsers();
    if (!res.success) {
      setError(res.message);
      setLoading(false);
      return;
    }
    setUsers(res.data.users);
    setLoading(false);
  };

  /* ────────────────── Question CRUD ────────────────── */
  const openCreate = () => {
    setEditingQuestion(null);
    setModalInitialValues(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditingQuestion(q);
    setModalInitialValues({
      title: q.title,
      description: q.description,
      type: q.type,
      difficulty: q.difficulty,
      topic: q.topic,
      options: q.options || ["", "", "", ""],
      correct_answer: q.correct_answer,
    });
    setShowModal(true);
  };

  const handleQuestionSubmit = async (values, { setSubmitting }) => {
    setError("");
    setSuccess("");

    const payload = {
      ...values,
      options: values.type === "MCQ" ? values.options.filter((o) => o.trim()) : null,
    };

    let res;
    if (editingQuestion) {
      res = await endpoints.updateQuestion(
        editingQuestion.id,
        payload.title,
        payload.description,
        payload.type,
        payload.difficulty,
        payload.topic,
        payload.options,
        payload.correct_answer,
      );
    } else {
      res = await endpoints.createQuestion(
        payload.title,
        payload.description,
        payload.type,
        payload.difficulty,
        payload.topic,
        payload.options,
        payload.correct_answer,
      );
    }

    setSubmitting(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setSuccess(editingQuestion ? "Question updated successfully." : "Question created successfully.");
    setShowModal(false);
    fetchQuestions();
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Delete this question permanently?")) return;
    const res = await endpoints.deleteQuestion(id);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setSuccess("Question deleted.");
    fetchQuestions();
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user account permanently?")) return;
    const res = await endpoints.deleteUser(id);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setSuccess("User deleted.");
    fetchUsers();
  };

  /* ────────────────── Render ────────────────── */
  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage questions, users and system analytics</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        {[
          { id: "analytics", label: "📊 Analytics" },
          { id: "questions", label: "📝 Questions" },
          { id: "users", label: "👥 Users" },
        ].map(({ id, label }) => (
          <button key={id} className={`tab-btn${activeTab === id ? " active" : ""}`} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      {loading && (
        <div className="loading" style={{ padding: "3rem" }}>
          <div className="spinner"></div>
          Loading…
        </div>
      )}

      {/* ══════════════ Analytics Tab ══════════════ */}
      {activeTab === "analytics" && analytics && !loading && (
        <div>
          {/* Stat row */}
          <div className="grid grid-4" style={{ marginBottom: "2rem" }}>
            {[
              { icon: "👥", val: analytics.total_users, label: "Total Users" },
              { icon: "📝", val: analytics.total_questions, label: "Questions" },
              { icon: "🎯", val: analytics.total_attempts, label: "Total Attempts" },
              { icon: "📈", val: `${analytics.system_accuracy}%`, label: "System Accuracy" },
            ].map(({ icon, val, label }) => (
              <div className="stat-card" key={label}>
                <span className="stat-icon">{icon}</span>
                <div
                  className="stat-value"
                  style={label === "System Accuracy" ? { color: "var(--success)" } : undefined}
                >
                  {val}
                </div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Most Popular Topic */}
          {analytics.most_popular_topic && analytics.most_popular_topic !== "N/A" && (
            <div className="card" style={{ marginBottom: "2rem", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🔥</span>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    Most Popular Topic
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {analytics.most_popular_topic}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-2">
            {/* Question type split */}
            <div className="card">
              <div className="card-header">📦 Question Type Split</div>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  justifyContent: "center",
                  padding: "1rem 0",
                }}
              >
                {[
                  { label: "MCQ", val: analytics.total_mcq, color: "var(--info)" },
                  { label: "Coding", val: analytics.total_coding, color: "#A78BFA" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="stat-card" style={{ flex: 1, borderTop: `3px solid ${color}` }}>
                    <div className="stat-value" style={{ color, fontSize: "1.75rem" }}>
                      {val}
                    </div>
                    <div className="stat-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Topic distribution */}
            <div className="card">
              <div className="card-header">🗂️ Topic Distribution</div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Questions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topic_distribution.map((t) => (
                      <tr key={t.topic}>
                        <td style={{ fontWeight: 500 }}>{t.topic}</td>
                        <td>
                          <span className="badge badge-user">{t.count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ Questions Tab ══════════════ */}
      {activeTab === "questions" && !loading && (
        <div>
          <div style={{ marginBottom: "1.25rem" }}>
            <button className="btn btn-primary" onClick={openCreate}>
              + Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <span className="empty-state-icon">📭</span>
                <h3>No questions yet</h3>
                <p>Click "Add Question" to create the first one.</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th onClick={() => handleSort("id")} style={{ cursor: "pointer", userSelect: "none" }}>
                        #<SortIcon col="id" />
                      </th>
                      <th onClick={() => handleSort("title")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Title
                        <SortIcon col="title" />
                      </th>
                      <th onClick={() => handleSort("type")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Type
                        <SortIcon col="type" />
                      </th>
                      <th onClick={() => handleSort("difficulty")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Difficulty
                        <SortIcon col="difficulty" />
                      </th>
                      <th onClick={() => handleSort("topic")} style={{ cursor: "pointer", userSelect: "none" }}>
                        Topic
                        <SortIcon col="topic" />
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedQuestions.map((q) => (
                      <tr key={q.id}>
                        <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{q.id}</td>
                        <td
                          style={{
                            maxWidth: "260px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontWeight: 500,
                          }}
                        >
                          {q.title}
                        </td>
                        <td>
                          <span className={`badge badge-${q.type.toLowerCase()}`}>{q.type}</span>
                        </td>
                        <td>
                          <span className={`badge badge-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>{q.topic}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(q)}>
                              ✏️ Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuestion(q.id)}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ Users Tab ══════════════ */}
      {activeTab === "users" && !loading && (
        <div className="card">
          {users.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">👻</span>
              <h3>No users found</h3>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{u.id}</td>
                      <td style={{ fontWeight: 500 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
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
                            {u.name?.[0]?.toUpperCase() ?? "U"}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                      <td>
                        <span className={`badge badge-${u.role === "admin" ? "admin" : "user"}`}>{u.role}</span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        {u.role !== "admin" && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id)}>
                            🗑️ Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ Question Modal ══════════════ */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingQuestion ? "✏️ Edit Question" : "➕ Add New Question"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <Formik
              initialValues={modalInitialValues}
              validationSchema={questionSchema}
              onSubmit={handleQuestionSubmit}
              enableReinitialize
            >
              {({ isSubmitting, values, touched, errors }) => (
                <Form>
                  {/* Title */}
                  <div className="form-group">
                    <label>Title</label>
                    <Field
                      name="title"
                      type="text"
                      className={`form-control${touched.title && errors.title ? " form-control-error" : ""}`}
                      placeholder="e.g., What is a React hook?"
                    />
                    <ErrorMessage name="title" component="div" className="field-error" />
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label>Description</label>
                    <Field
                      name="description"
                      as="textarea"
                      rows={3}
                      className={`form-control${touched.description && errors.description ? " form-control-error" : ""}`}
                      placeholder="Provide the full question text…"
                    />
                    <ErrorMessage name="description" component="div" className="field-error" />
                  </div>

                  {/* Type / Difficulty / Topic */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "1rem",
                    }}
                  >
                    <div className="form-group">
                      <label>Type</label>
                      <Field name="type" as="select" className="form-control">
                        <option value="MCQ">MCQ</option>
                        <option value="CODING">Coding</option>
                      </Field>
                    </div>

                    <div className="form-group">
                      <label>Difficulty</label>
                      <Field
                        name="difficulty"
                        as="select"
                        className={`form-control${touched.difficulty && errors.difficulty ? " form-control-error" : ""}`}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </Field>
                      <ErrorMessage name="difficulty" component="div" className="field-error" />
                    </div>

                    <div className="form-group">
                      <label>Topic</label>
                      <Field
                        name="topic"
                        type="text"
                        className={`form-control${touched.topic && errors.topic ? " form-control-error" : ""}`}
                        placeholder="e.g., React"
                      />
                      <ErrorMessage name="topic" component="div" className="field-error" />
                    </div>
                  </div>

                  {/* MCQ Options */}
                  {values.type === "MCQ" && (
                    <FieldArray name="options">
                      {() => (
                        <div className="form-group">
                          <label>Options</label>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {values.options.map((_, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                                <span
                                  style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: "50%",
                                    background: "var(--bg-secondary)",
                                    border: "1.5px solid var(--border)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    color: "var(--text-secondary)",
                                    flexShrink: 0,
                                  }}
                                >
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <Field
                                  name={`options.${i}`}
                                  type="text"
                                  className="form-control"
                                  placeholder={`Option ${i + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                          {typeof errors.options === "string" && touched.options && (
                            <div className="field-error">{errors.options}</div>
                          )}
                        </div>
                      )}
                    </FieldArray>
                  )}

                  {/* Correct Answer */}
                  <div className="form-group">
                    <label>Correct Answer</label>
                    <Field
                      name="correct_answer"
                      as="textarea"
                      rows={2}
                      className={`form-control${touched.correct_answer && errors.correct_answer ? " form-control-error" : ""}`}
                      placeholder={
                        values.type === "MCQ"
                          ? "Must match one of the options exactly"
                          : "Enter expected answer or explanation"
                      }
                    />
                    <ErrorMessage name="correct_answer" component="div" className="field-error" />
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? "Saving…" : editingQuestion ? "Update Question" : "Create Question"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
