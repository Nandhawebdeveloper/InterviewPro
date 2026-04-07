/**
 * pages/Register.jsx – Sign-Up Page
 *
 * Professional registration page with:
 * • Formik + Yup validation
 * • Dark/light theme support
 * • Password strength indicator
 * • Consistent design with Login page
 */

import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LogoIcon from "../components/LogoIcon";
import Toast from "../components/Toast";

const registerSchema = Yup.object({
  name: Yup.string().min(3, "Name must be at least 3 characters").required("Name is required"),
  email: Yup.string().email("Please enter a valid email address").required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-zA-Z]/, "Password must contain at least one letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(/[^a-zA-Z0-9]/, "Password must contain at least one symbol")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

/** Simple password strength score: 0–4 */
const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const STRENGTH_COLORS = ["var(--border)", "#FF4D4F", "#FF7A00", "#FAAD14", "#0ACF83"];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

const Register = () => {
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      try {
        await register(values.name, values.email, values.password);
        setShowSuccess(true);
        // Navigate after showing the success toast for 2 seconds
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      } catch (err) {
        setStatus(err.message || "Registration failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [register, navigate],
  );

  return (
    <div className="auth-page">
      <Toast visible={showSuccess} type="success" message="✓ Successfully registered!" />

      {/* Theme toggle */}
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

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join thousands preparing for tech interviews. It's free.</p>

        <Formik
          initialValues={{ name: "", email: "", password: "", confirmPassword: "" }}
          validationSchema={registerSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, status, values, touched, errors }) => {
            const pwStrength = getStrength(values.password);
            const pwColor = STRENGTH_COLORS[pwStrength];
            const pwLabel = STRENGTH_LABELS[pwStrength];

            return (
              <Form noValidate>
                {status && <div className="alert alert-error">⚠️ {status}</div>}

                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="name">Full name</label>
                  <Field
                    autoFocus
                    id="name"
                    name="name"
                    type="text"
                    className={`form-control${touched.name && errors.name ? " form-control-error" : ""}`}
                    placeholder="Alex Johnson"
                    autoComplete="name"
                  />
                  <ErrorMessage name="name" component="div" className="field-error" />
                </div>

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
                      placeholder="Letters, numbers &amp; symbols"
                      autoComplete="new-password"
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
                  {/* Strength bar */}
                  {values.password.length > 0 && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div
                        style={{
                          height: "3px",
                          borderRadius: "9999px",
                          background: "var(--border)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(pwStrength / 4) * 100}%`,
                            background: pwColor,
                            borderRadius: "9999px",
                            transition: "width 0.3s ease, background 0.3s ease",
                          }}
                        />
                      </div>
                      {pwLabel && (
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: pwColor,
                            marginTop: "0.25rem",
                            fontWeight: 500,
                          }}
                        >
                          {pwLabel} password
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <div className="pw-wrap">
                    <Field
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      className={`form-control${touched.confirmPassword && errors.confirmPassword ? " form-control-error" : ""}`}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <ErrorMessage name="confirmPassword" component="div" className="field-error" />
                </div>

                <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating account…" : "Create Account →"}
                </button>
              </Form>
            );
          }}
        </Formik>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in →</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
