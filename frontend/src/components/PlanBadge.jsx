/**
 * components/PlanBadge.jsx - User Plan Badge
 *
 * Displays the user's current plan (Free / Pro / Team) as a small badge.
 * Shown in the Sidebar and Navbar.
 */

import { useAuth } from "../context/AuthContext";

const PLAN_STYLES = {
  free: { label: "Free", className: "plan-badge-free" },
  pro: { label: "Pro", className: "plan-badge-pro" },
  team: { label: "Team", className: "plan-badge-team" },
};

const PlanBadge = () => {
  const { features, paymentEnabled } = useAuth();

  if (!paymentEnabled) return null;

  const plan = features?.plan || "free";
  const style = PLAN_STYLES[plan] || PLAN_STYLES.free;

  return <span className={`plan-badge ${style.className}`}>{style.label}</span>;
};

export default PlanBadge;
