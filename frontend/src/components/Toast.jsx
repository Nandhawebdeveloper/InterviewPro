import PropTypes from "prop-types";

const Toast = ({ message, type = "success", visible }) => {
  if (!visible) return null;

  const background = type === "success" ? "#0ACF83" : "#FF4D4F";

  return (
    <div
      style={{
        position: "fixed",
        top: "2rem",
        left: "50%",
        transform: "translateX(-50%)",
        background,
        color: "white",
        padding: "1rem 1.5rem",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 9999,
        fontWeight: 500,
        opacity: 1,
        transition: "opacity 0.3s ease-out",
      }}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error"]),
  visible: PropTypes.bool.isRequired,
};

export default Toast;
