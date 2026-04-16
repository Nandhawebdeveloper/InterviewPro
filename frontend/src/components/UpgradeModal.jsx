/**
 * components/UpgradeModal.jsx - Upgrade Prompt Modal
 *
 * Shown when a free-plan user tries to access a Pro feature.
 * Props:
 *   isOpen (bool) - whether the modal is visible
 *   onClose (fn) - called when user dismisses the modal
 *   feature (string) - name of the locked feature (for the message)
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const UpgradeModal = ({ isOpen, onClose, feature }) => {
  const navigate = useNavigate();
  const { paymentEnabled } = useAuth();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate("/pricing");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <div className="upgrade-modal-icon">🔒</div>
        <h2 className="upgrade-modal-title">Pro Feature</h2>
        <p className="upgrade-modal-desc">
          <strong>{feature}</strong> is available on the Pro plan.
          {paymentEnabled ? " Upgrade now to unlock unlimited access!" : " Payment is currently disabled."}
        </p>
        {paymentEnabled && (
          <button className="btn btn-primary upgrade-modal-btn" onClick={handleUpgrade}>
            💎 Upgrade to Pro
          </button>
        )}
        <button className="btn btn-outline upgrade-modal-btn" onClick={onClose}>
          Maybe Later
        </button>
      </div>
    </div>
  );
};

export default UpgradeModal;
