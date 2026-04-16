/**
 * pages/Pricing.jsx – Plan Upgrade & Payment History
 *
 * Features:
 * • 3 pricing tiers (Free, Pro, Team)
 * • Razorpay checkout integration
 * • Payment history table
 * • Redirects to dashboard if payment gateway is disabled
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import endpoints from "../services/endpoints";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    desc: "Perfect for getting started",
    features: [
      "20 questions / day",
      "MCQ practice mode",
      "Basic accuracy stats",
      "5 topics access",
      "Community support",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "₹399",
    period: "/ month",
    desc: "For serious job seekers",
    features: [
      "Unlimited questions",
      "MCQ + Coding modes",
      "Advanced analytics & charts",
      "All 16 topics",
      "Timed mock sessions",
      "Detailed AI feedback",
      "Priority support",
    ],
    highlight: true,
  },
  {
    key: "team",
    name: "Team",
    price: "₹999",
    period: "/ month",
    desc: "For bootcamps & colleges",
    features: [
      "Everything in Pro",
      "Up to 25 team members",
      "Admin dashboard",
      "Bulk progress reports",
      "Custom topic sets",
      "Dedicated account manager",
    ],
  },
];

const Pricing = () => {
  const { user, setUser, paymentEnabled, isFree, isPro, isTeam } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [processing, setProcessing] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!paymentEnabled) {
      navigate("/dashboard");
      return;
    }
    fetchPaymentHistory();
  }, [paymentEnabled]);

  const fetchPaymentHistory = async () => {
    setLoadingPayments(true);
    const res = await endpoints.getPaymentHistory();
    if (res.success) {
      setPayments(res.data.payments || []);
    }
    setLoadingPayments(false);
  };

  const isCurrentPlan = (planKey) => {
    if (planKey === "free") return isFree;
    if (planKey === "pro") return isPro;
    if (planKey === "team") return isTeam;
    return false;
  };

  const handleUpgrade = async (planKey) => {
    setError("");
    setSuccess("");
    setProcessing(planKey);

    // Step 1: Create order
    const orderRes = await endpoints.createPaymentOrder(planKey);
    if (!orderRes.success) {
      setError(orderRes.message);
      setProcessing("");
      return;
    }

    const { order_id, amount, currency, key_id, user_name, user_email } = orderRes.data;

    // Step 2: Open Razorpay checkout
    const options = {
      key: key_id,
      amount: amount,
      currency: currency,
      name: "InterviewPro AI",
      description: `Upgrade to ${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan`,
      order_id: order_id,
      prefill: {
        name: user_name,
        email: user_email,
      },
      theme: {
        color: "#6366f1",
      },
      handler: async (response) => {
        // Step 3: Verify payment
        const verifyRes = await endpoints.verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
        );

        if (verifyRes.success) {
          setSuccess(`Successfully upgraded to ${verifyRes.data.plan} plan!`);
          // Update user in AuthContext
          setUser((prev) => ({
            ...prev,
            plan: verifyRes.data.plan,
            plan_expires_at: verifyRes.data.plan_expires_at,
          }));
          fetchPaymentHistory();
        } else {
          setError(verifyRes.message || "Payment verification failed");
        }
        setProcessing("");
      },
      modal: {
        ondismiss: () => {
          setProcessing("");
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setError(response.error?.description || "Payment failed. Please try again.");
        setProcessing("");
      });
      rzp.open();
    } catch (e) {
      setError("Failed to open payment window. Please try again.");
      setProcessing("");
    }
  };

  const activePlan = user?.plan || "free";
  const expiresAt = user?.plan_expires_at;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pricing & Plans</h1>
          <p className="page-subtitle">
            Current plan: <strong style={{ color: "var(--accent)", textTransform: "capitalize" }}>{activePlan}</strong>
            {expiresAt && activePlan !== "free" && (
              <span style={{ marginLeft: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                · Expires {new Date(expiresAt).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          ⚠️ {error}
          <button
            onClick={() => setError("")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", marginLeft: "auto" }}
          >
            ✕
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
          ✅ {success}
          <button
            onClick={() => setSuccess("")}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", marginLeft: "auto" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="pricing-grid">
        {PLANS.map((plan) => {
          const current = isCurrentPlan(plan.key);
          return (
            <div
              key={plan.key}
              className={`pricing-card${plan.highlight ? " pricing-highlight" : ""}${current ? " pricing-current" : ""}`}
            >
              {plan.highlight && <div className="pricing-badge">Most Popular</div>}
              {current && <div className="pricing-current-badge">Current Plan</div>}
              <div className="pricing-name">{plan.name}</div>
              <div className="pricing-price-row">
                <span className="pricing-price">{plan.price}</span>
                <span className="pricing-period">{plan.period}</span>
              </div>
              <p className="pricing-desc">{plan.desc}</p>
              <ul className="pricing-features">
                {plan.features.map((f) => (
                  <li key={f}>
                    <span className="pricing-check">✓</span> {f}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: "auto" }}>
                {plan.key === "free" ? (
                  <button className="btn btn-outline" disabled style={{ width: "100%", opacity: 0.6 }}>
                    {current ? "Current Plan" : "Free Forever"}
                  </button>
                ) : current ? (
                  <button className="btn btn-outline" disabled style={{ width: "100%", opacity: 0.6 }}>
                    ✅ Active Plan
                  </button>
                ) : (
                  <button
                    className={`btn ${plan.highlight ? "btn-primary" : "btn-outline"}`}
                    style={{ width: "100%" }}
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={!!processing}
                  >
                    {processing === plan.key ? (
                      <>
                        <span className="spinner" style={{ width: 14, height: 14, marginRight: 6 }} />
                        Processing…
                      </>
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment History */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="card-header">
          <h3 className="card-title">Payment History</h3>
        </div>
        {loadingPayments ? (
          <div className="loading">
            <div className="spinner" />
            Loading…
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem" }}>
            <span className="empty-state-icon">💳</span>
            <p>No payments yet</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment ID</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td style={{ textTransform: "capitalize" }}>{p.plan}</td>
                    <td>₹{(p.amount / 100).toFixed(0)}</td>
                    <td>
                      <span
                        className={`badge badge-${p.status === "paid" ? "easy" : p.status === "failed" ? "hard" : "medium"}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{p.razorpay_payment_id || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
