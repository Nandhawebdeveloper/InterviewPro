/**
 * components/LogoIcon.jsx
 *
 * Bullseye target + upward-right arrow — matches the app icon.
 * The gradient background is provided by the parent container class
 * (landing-logo-icon / navbar-logo-icon / auth-logo-icon).
 *
 * Usage:
 *   import LogoIcon from "../components/LogoIcon";
 *   <LogoIcon size={20} />
 */

const LogoIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* Outer ring */}
    <circle cx="11" cy="13" r="9" />
    {/* Middle ring */}
    <circle cx="11" cy="13" r="5.5" />
    {/* Inner ring */}
    <circle cx="11" cy="13" r="2.4" />
    {/* Center dot */}
    <circle cx="11" cy="13" r="0.9" fill="white" />
    {/* Arrow shaft from center to top-right */}
    <line x1="11" y1="13" x2="20.5" y2="3.5" />
    {/* Arrow head */}
    <polyline points="14.5 3.5 20.5 3.5 20.5 9.5" />
  </svg>
);

export default LogoIcon;
