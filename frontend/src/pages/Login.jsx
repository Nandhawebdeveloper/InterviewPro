/**
 * pages/Login.jsx – Sign-In Page
 *
 * Professional auth page with:
 * • Formik + Yup validation
 * • Dark/light theme support via ThemeContext
 * • Auth orb background animations
 * • Feature highlights below the card
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LogoIcon from "../components/LogoIcon";

const loginSchema = Yup.object({
  email: Yup.string().email("Please enter a valid email address").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const Login = () => {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    setStatus(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      setStatus(err.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Theme toggle – top-right corner */}
      <button
        className="auth-theme-toggle"
        onClick={toggleTheme}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? "☀️" : "🌙"}
      </button>

      <div className="auth-card">
        {/* Logo */}
        <Link to="/" className="auth-logo">
          <span className="auth-logo-icon">
            <LogoIcon size={22} />
          </span>
          <span className="auth-brand-name">
            Interview<span>Pro</span>
          </span>
        </Link>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue your interview preparation journey.</p>

        <Formik initialValues={{ email: "", password: "" }} validationSchema={loginSchema} onSubmit={handleSubmit}>
          {({ isSubmitting, status, touched, errors }) => (
            <Form noValidate>
              {status && <div className="alert alert-error">⚠️ {status}</div>}

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <Field
                  id="email"
                  name="email"
                  type="email"
                  className={`form-control${touched.email && errors.email ? " form-control-error" : ""}`}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <ErrorMessage name="email" component="div" className="field-error" />
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="pw-wrap">
                  <Field
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    className={`form-control${touched.password && errors.password ? " form-control-error" : ""}`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="pw-toggle"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>
                <ErrorMessage name="password" component="div" className="field-error" />
              </div>

              <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in…" : "Sign In →"}
              </button>
            </Form>
          )}
        </Formik>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one free →</Link>
        </p>

        {/* Feature highlights */}
        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid var(--border)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          {[
            { icon: "📊", label: "Track Progress" },
            { icon: "🎯", label: "Smart Practice" },
            { icon: "📈", label: "Analytics" },
            { icon: "🏆", label: "Ace Interviews" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                padding: "0.5rem 0.625rem",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <span>{icon}</span>
              <span style={{ fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
