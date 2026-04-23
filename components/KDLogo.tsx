// Inline K&D wordmark — placeholder geometry until the real SVG drops in.
// Renders as a small green circle with a stylized "K" leaf, plus the wordmark
// "K&D LANDSCAPING" beside it. Swap this with the real /public/logo.svg when ready.
import React from 'react';

export function KDLogo({ size = 28, dark = false }: { size?: number; dark?: boolean }) {
  const fg = dark ? '#FFFFFF' : '#212221';
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="rounded-full flex items-center justify-center"
        style={{ width: size, height: size, background: '#7A9B49' }}
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 20 20" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 3v14M5 10l7-7M5 10l7 7" />
        </svg>
      </div>
      <div className="leading-none">
        <div className="font-display tracking-tight" style={{ fontSize: size * 0.5, color: fg, fontWeight: 700, letterSpacing: '0.02em' }}>
          K&amp;D
        </div>
        <div className="font-mono uppercase" style={{ fontSize: size * 0.27, color: dark ? '#FFFFFF' : '#5C544A', letterSpacing: '0.18em', marginTop: 2 }}>
          Landscaping
        </div>
      </div>
    </div>
  );
}
