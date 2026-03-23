/*
 * 🎨 STL Platform - Logo Component
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-24
 * 👥 Developers: CERDEX, Claude (Anthropic)
 */

export default function StlLogo() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ maxWidth: '120px', maxHeight: '120px' }}
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="95" fill="currentColor" fillOpacity="0.1" />

      {/* Decorative elements - creative brush strokes */}
      <path
        d="M 50 80 Q 60 70 70 80 T 90 80"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.3"
        fill="none"
      />
      <path
        d="M 110 120 Q 120 110 130 120 T 150 120"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.3"
        fill="none"
      />

      {/* Main text - СТЛ */}
      <text
        x="100"
        y="115"
        fontSize="56"
        fontWeight="700"
        fill="currentColor"
        textAnchor="middle"
        fontFamily="'Georgia', serif"
      >
        СТЛ
      </text>

      {/* Decorative underline */}
      <line
        x1="45"
        y1="130"
        x2="155"
        y2="130"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.6"
      />

      {/* Small creative dots */}
      <circle cx="40" cy="100" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="160" cy="100" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="100" cy="50" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="100" cy="150" r="3" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}
