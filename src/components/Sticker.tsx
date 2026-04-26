import type { CSSProperties } from "react";

export function ThornHeart({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id="rh" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#ff2a5c" />
          <stop offset="1" stopColor="#800020" />
        </linearGradient>
      </defs>
      <path
        fill="url(#rh)"
        d="M32 56s-22-12-22-30c0-7 5-12 12-12 5 0 8 3 10 7 2-4 5-7 10-7 7 0 12 5 12 12 0 18-22 30-22 30z"
      />
      <g stroke="#ff2a5c" strokeWidth="1" fill="none">
        <path d="M8 18 L2 12 M56 18 L62 12 M16 8 L14 0 M48 8 L50 0 M32 60 L32 64" />
      </g>
    </svg>
  );
}

export function StarSpike({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden>
      <path
        fill="#ff2a5c"
        d="M32 0 L36 26 L64 32 L36 38 L32 64 L28 38 L0 32 L28 26 Z"
      />
    </svg>
  );
}
