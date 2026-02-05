import React from 'react';

function PiLogo({ className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M5 6h14v2h-3v10h-2V8H10v10H8V8H5V6z" />
    </svg>
  );
}

export default PiLogo;

