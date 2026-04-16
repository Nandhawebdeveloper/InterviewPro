/**
 * components/UsageBar.jsx - Daily Question Usage Progress Bar
 *
 * Shows "15 / 20 questions used today" with a progress bar.
 * Only visible for free-plan users when payment gateway is enabled.
 */

import { useAuth } from "../context/AuthContext";

const UsageBar = () => {
  const { features, paymentEnabled } = useAuth();

  if (!paymentEnabled || !features) return null;

  const limit = features.daily_question_limit;
  if (limit === null || limit === undefined) return null; // unlimited

  const used = features.questions_used_today || 0;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = pct >= 80;
  const isAtLimit = used >= limit;

  return (
    <div className="usage-bar-container">
      <div className="usage-bar-label">
        <span>
          📝 {used}/{limit} questions today
        </span>
        {isAtLimit && <span className="usage-bar-limit-text">Limit reached</span>}
      </div>
      <div className="usage-bar-track">
        <div
          className={`usage-bar-fill ${isAtLimit ? "usage-bar-fill-danger" : isNearLimit ? "usage-bar-fill-warn" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default UsageBar;
