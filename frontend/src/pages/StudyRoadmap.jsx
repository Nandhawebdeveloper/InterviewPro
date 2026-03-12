import { useState, useEffect } from "react";
import endpoints from "../services/endpoints";

const ROLE_ICONS = {
  frontend: "🎨",
  backend: "⚙️",
  fullstack: "🔗",
  "data-science": "📊",
  devops: "🚀",
};

const StudyRoadmap = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const loadRoadmaps = async () => {
    const res = await endpoints.getRoadmaps();
    if (res.success) {
      setRoadmaps(res.data.roadmaps || []);
    }
    setLoading(false);
  };

  const selectRoadmap = async (role) => {
    setSelectedRole(role);
    setLoading(true);
    const res = await endpoints.getRoadmap(role);
    if (res.success) {
      setRoadmap(res.data.roadmap);
      // Load completed steps from localStorage
      const saved = localStorage.getItem(`roadmap_${role}`);
      setCompletedSteps(saved ? JSON.parse(saved) : {});
    }
    setLoading(false);
  };

  const toggleStep = (order) => {
    const updated = { ...completedSteps, [order]: !completedSteps[order] };
    setCompletedSteps(updated);
    localStorage.setItem(`roadmap_${selectedRole}`, JSON.stringify(updated));
  };

  const getProgress = () => {
    if (!roadmap) return 0;
    const done = roadmap.steps.filter((s) => completedSteps[s.order]).length;
    return Math.round((done / roadmap.steps.length) * 100);
  };

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: "60vh" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Role selection screen
  if (!selectedRole || !roadmap) {
    return (
      <div className="roadmap-page">
        <div className="page-header">
          <h1>🗺️ Study Roadmap</h1>
          <p className="text-secondary">Choose your career goal to get a personalized learning path</p>
        </div>

        <div className="roadmap-grid">
          {roadmaps.map((rm) => (
            <div key={rm.role} className="roadmap-card card" onClick={() => selectRoadmap(rm.role)}>
              <div className="roadmap-card-icon">{ROLE_ICONS[rm.role] || "📘"}</div>
              <h3>{rm.title}</h3>
              <p className="text-secondary">{rm.description}</p>
              <span className="badge">{rm.steps_count} Steps</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Roadmap detail view
  const progress = getProgress();

  return (
    <div className="roadmap-page">
      <div className="page-header">
        <button
          className="btn btn-outline btn-sm"
          onClick={() => {
            setSelectedRole(null);
            setRoadmap(null);
          }}
        >
          ← Back to Roadmaps
        </button>
        <h1>
          {ROLE_ICONS[selectedRole]} {roadmap.title}
        </h1>
        <p className="text-secondary">{roadmap.description}</p>
      </div>

      {/* Progress bar */}
      <div className="roadmap-progress">
        <div className="roadmap-progress-info">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Timeline */}
      <div className="roadmap-timeline">
        {roadmap.steps.map((step, idx) => {
          const done = completedSteps[step.order];
          return (
            <div key={step.order} className={`roadmap-step ${done ? "roadmap-step-done" : ""}`}>
              <div className="roadmap-step-marker" onClick={() => toggleStep(step.order)}>
                {done ? "✅" : <span className="step-number">{step.order}</span>}
              </div>
              <div className="roadmap-step-content">
                <div className="roadmap-step-header">
                  <h3>{step.title}</h3>
                  <span className="badge">{step.duration}</span>
                </div>
                <p className="text-secondary">{step.description}</p>
                <div className="roadmap-step-topics">
                  {step.topics.map((t) => (
                    <span key={t} className="badge badge-outline">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              {idx < roadmap.steps.length - 1 && <div className="roadmap-step-line"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudyRoadmap;
