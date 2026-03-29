/**
 * components/IdleWarning.jsx - Idle Timeout Warning
 *
 * Shows a warning modal when user is about to be logged out due to inactivity.
 */

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const IdleWarning = () => {
  const { isAuthenticated, idleTime, idleTimeout, logout, resetIdleTimer } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60); // 60 seconds warning
  const [warningTriggered, setWarningTriggered] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      setWarningTriggered(false);
      return;
    }

    // Show warning when 1 minute left (for 30-minute timeout)
    const warningThreshold = idleTimeout - 60000; // 1 minute before timeout
    const shouldShowWarning = idleTime >= warningThreshold;

    if (shouldShowWarning && !warningTriggered) {
      setWarningTriggered(true);
      setShowWarning(true);
      setCountdown(60);
    }
    // Don't auto-hide the warning once it's triggered
  }, [idleTime, idleTimeout, isAuthenticated, warningTriggered]);

  useEffect(() => {
    if (!showWarning) {
      setCountdown(60); // Reset countdown when modal closes
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          logout();
          setShowWarning(false);
          setWarningTriggered(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, logout]);

  if (!showWarning) return null;

  const handleStayLoggedIn = () => {
    resetIdleTimer(); // Reset the idle timer
    setShowWarning(false);
    setWarningTriggered(false);
  };

  const handleLogoutNow = () => {
    logout();
    setShowWarning(false);
    setWarningTriggered(false);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div className="modal-content" style={{
        background: 'var(--bg-primary)',
        borderRadius: '8px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            color: 'var(--warning-color, #f39c12)'
          }}>
            ⏰
          </div>
          <h3 style={{
            margin: '0 0 0.5rem 0',
            color: 'var(--text-primary)',
            fontSize: '1.25rem'
          }}>
            Session Timeout Warning
          </h3>
          <p style={{
            margin: '0',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            lineHeight: 1.5
          }}>
            You will be automatically logged out in <strong>{countdown}</strong> seconds due to inactivity.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={handleStayLoggedIn}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            Stay Logged In
          </button>
          <button
            onClick={handleLogoutNow}
            className="btn btn-outline"
            style={{ flex: 1 }}
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdleWarning;