import { useState, useEffect } from "react";
import endpoints from "../services/endpoints";

const Badges = () => {
  const [myBadges, setMyBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [newBadges, setNewBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    const [myRes, allRes] = await Promise.all([endpoints.getMyBadges(), endpoints.getAllBadges()]);

    if (myRes.success) {
      setMyBadges(myRes.data.badges || []);
      setNewBadges(myRes.data.new_badges || []);
    }
    if (allRes.success) {
      setAllBadges(allRes.data.badges || []);
    }
    setLoading(false);
  };

  const earnedIds = new Set(myBadges.map((ub) => ub.badge_id));

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: "60vh" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="badges-page">
      <div className="page-header">
        <h1>🏆 Achievements & Badges</h1>
        <p className="text-secondary">
          {myBadges.length} of {allBadges.length} badges earned
        </p>
      </div>

      {/* New badge notification */}
      {newBadges.length > 0 && (
        <div className="alert alert-success badge-notification">
          🎉 You just earned {newBadges.length} new badge{newBadges.length > 1 ? "s" : ""}!
          {newBadges.map((b) => (
            <span key={b.id} className="new-badge-name">
              {b.icon} {b.name}
            </span>
          ))}
        </div>
      )}

      {/* Progress */}
      <div className="badge-progress card">
        <div className="badge-progress-info">
          <span>Badge Collection Progress</span>
          <span>
            {myBadges.length}/{allBadges.length}
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${allBadges.length > 0 ? (myBadges.length / allBadges.length) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      {/* Earned badges */}
      {myBadges.length > 0 && (
        <section className="badge-section">
          <h2>✅ Earned Badges</h2>
          <div className="badges-grid">
            {myBadges.map((ub) => (
              <div key={ub.id} className="badge-card card badge-earned">
                <div className="badge-card-icon">{ub.badge?.icon || "🏅"}</div>
                <h3>{ub.badge?.name}</h3>
                <p className="text-secondary">{ub.badge?.description}</p>
                <span className="badge-earned-date">Earned {new Date(ub.earned_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Locked badges */}
      <section className="badge-section">
        <h2>🔒 Locked Badges</h2>
        <div className="badges-grid">
          {allBadges
            .filter((b) => !earnedIds.has(b.id))
            .map((b) => (
              <div key={b.id} className="badge-card card badge-locked">
                <div className="badge-card-icon badge-icon-locked">{b.icon || "🏅"}</div>
                <h3>{b.name}</h3>
                <p className="text-secondary">{b.description}</p>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
};

export default Badges;
