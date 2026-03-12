/**
 * pages/Profile.jsx – User Profile Page
 *
 * Displays user info, stats, and allows name/password updates.
 */

import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import endpoints from "../services/endpoints";

const profileSchema = Yup.object({
  name: Yup.string().min(2, "Name must be at least 2 characters").required("Name is required"),
  currentPassword: Yup.string().when("newPassword", {
    is: (val) => val && val.length > 0,
    then: (schema) => schema.required("Current password is required to set a new password"),
    otherwise: (schema) => schema.notRequired(),
  }),
  newPassword: Yup.string().test(
    "min-if-filled",
    "New password must be at least 6 characters",
    (val) => !val || val.length >= 6,
  ),
});

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Edit form */
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const fetchProfile = async () => {
    const res = await endpoints.getProfile();
    if (!res.success) {
      setError(res.message);
      setLoading(false);
      return;
    }
    setProfile(res.data.profile);
    setLoading(false);
  };

  const handleSave = async (values, { setSubmitting }) => {
    setError("");

    const payload = {};
    if (values.name !== profile.name) payload.name = values.name;
    if (values.newPassword) {
      payload.current_password = values.currentPassword;
      payload.new_password = values.newPassword;
    }

    if (Object.keys(payload).length === 0) {
      setEditing(false);
      setSubmitting(false);
      return;
    }

    const res = await endpoints.updateProfile(payload);
    setSubmitting(false);
    if (!res.success) {
      setError(res.message);
      return;
    }

    setProfile({ ...profile, ...res.data.profile });
    setSuccess("Profile updated successfully!");
    setEditing(false);
  };

  const accColor = (v) => (v >= 75 ? "var(--success)" : v >= 50 ? "var(--warning)" : "var(--danger)");

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>Loading profile…
      </div>
    );

  if (!profile) return <div className="alert alert-error">Failed to load profile</div>;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">View and manage your account</p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Profile Card */}
      <div className="grid grid-2" style={{ marginBottom: "2rem" }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div className="profile-avatar-large">{profile.name?.[0]?.toUpperCase() ?? "U"}</div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {profile.name}
              </h2>
              <p style={{ color: "var(--text-secondary)", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
                {profile.email}
              </p>
              <span className={`badge badge-${profile.role}`} style={{ marginTop: "0.5rem" }}>
                {profile.role}
              </span>
            </div>
          </div>

          <div className="profile-info-grid">
            <div className="profile-info-item">
              <span className="profile-info-label">Member Since</span>
              <span className="profile-info-value">
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="profile-info-item">
              <span className="profile-info-label">Streak</span>
              <span className="profile-info-value">🔥 {profile.streak} days</span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="card">
          <div className="card-header">📊 Performance Stats</div>
          <div className="grid grid-3" style={{ gap: "1rem" }}>
            <div className="stat-card" style={{ padding: "1rem" }}>
              <span className="stat-icon">🎯</span>
              <div className="stat-value">{profile.total_attempts}</div>
              <div className="stat-label">Attempts</div>
            </div>
            <div className="stat-card" style={{ padding: "1rem" }}>
              <span className="stat-icon">✅</span>
              <div className="stat-value" style={{ color: "var(--success)" }}>
                {profile.correct_attempts}
              </div>
              <div className="stat-label">Correct</div>
            </div>
            <div className="stat-card" style={{ padding: "1rem" }}>
              <span className="stat-icon">📈</span>
              <div className="stat-value" style={{ color: accColor(profile.accuracy) }}>
                {profile.accuracy}%
              </div>
              <div className="stat-label">Accuracy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && profile && (
        <div className="card">
          <div className="card-header">✏️ Edit Profile</div>
          <Formik
            initialValues={{
              name: profile.name,
              currentPassword: "",
              newPassword: "",
            }}
            validationSchema={profileSchema}
            onSubmit={handleSave}
          >
            {({ isSubmitting, touched, errors, resetForm }) => (
              <Form>
                <div className="form-group">
                  <label>Name</label>
                  <Field
                    name="name"
                    type="text"
                    className={`form-control${touched.name && errors.name ? " form-control-error" : ""}`}
                  />
                  <ErrorMessage name="name" component="div" className="field-error" />
                </div>

                <div style={{ borderTop: "1px solid var(--border)", margin: "1.5rem 0", paddingTop: "1.5rem" }}>
                  <h3
                    style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}
                  >
                    Change Password (optional)
                  </h3>
                  <div className="form-group">
                    <label>Current Password</label>
                    <Field
                      name="currentPassword"
                      type="password"
                      className={`form-control${touched.currentPassword && errors.currentPassword ? " form-control-error" : ""}`}
                      placeholder="Enter current password"
                    />
                    <ErrorMessage name="currentPassword" component="div" className="field-error" />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <Field
                      name="newPassword"
                      type="password"
                      className={`form-control${touched.newPassword && errors.newPassword ? " form-control-error" : ""}`}
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <ErrorMessage name="newPassword" component="div" className="field-error" />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      setEditing(false);
                      setError("");
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </div>
  );
};

export default Profile;
