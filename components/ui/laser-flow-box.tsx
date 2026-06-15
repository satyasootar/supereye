'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import LaserFlow from './LaserFlow';

function useCssVar(name: string) {
  const { resolvedTheme } = useTheme();
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue(
      getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    );
  }, [resolvedTheme, name]);

  return value;
}

/**
 * Hero + Dashboard showcase section.
 *
 * Layout strategy:
 * ┌─────────────────────────────────┐
 * │        LaserFlow (hero)         │  ← overflow:hidden, contains WebGL canvas
 * │                                 │
 * │   ┌───── rectangle top ──────┐  │  ← top-half of the "rectangle" with
 * │   │                          │  │     border-top + border-left/right,
 * │   │                          │  │     border-bottom-left/right-radius: 0
 * └───┼──────────────────────────┼──┘
 *     │   Dashboard area         │      ← continues seamlessly below,
 *     │   (your content here)    │        same width, matching border,
 *     │                          │        border-top: none,
 *     └──────────────────────────┘        border-bottom-left/right-radius: themed
 *
 * The two halves share the same width (86%) and horizontal center,
 * creating the illusion of one continuous bordered rectangle.
 */

const RECT_WIDTH = '86%';
const HERO_HEIGHT = 800;       // px – laser beam area
const DASHBOARD_HEIGHT = 500;  // px – adjustable dashboard showcase area

export function LaserFlowBoxExample() {
  const revealImgRef = useRef<HTMLImageElement>(null);
  const accentColor = useCssVar('--accent-blue');

  return (
    <div style={{ width: '100%', backgroundColor: 'var(--bg-app)' }}>
      {/* ── Hero: Laser beam area ── */}
      <div
        style={{
          height: `${HERO_HEIGHT}px`,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-app)',
          width: '100%',
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const el = revealImgRef.current;
          if (el) {
            el.style.setProperty('--mx', `${x}px`);
            el.style.setProperty('--my', `${y + rect.height * 0.5}px`);
          }
        }}
        onMouseLeave={() => {
          const el = revealImgRef.current;
          if (el) {
            el.style.setProperty('--mx', '-9999px');
            el.style.setProperty('--my', '-9999px');
          }
        }}
      >
        <LaserFlow
          horizontalBeamOffset={0.1}
          verticalBeamOffset={0.0}
          color={accentColor || '#5A775C'}
          horizontalSizing={0.5}
          verticalSizing={2}
          wispDensity={1}
          wispSpeed={15}
          wispIntensity={5}
          flowSpeed={0.35}
          flowStrength={0.25}
          fogIntensity={0.45}
          fogScale={0.3}
          fogFallSpeed={0.6}
          decay={1.1}
          falloffStart={1.2}
        />

        {/* Top half of the rectangle – sits inside the laser area */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: RECT_WIDTH,
            height: '45%',
            backgroundColor: 'var(--bg-elevated)',
            borderTop: '2px solid var(--accent-blue)',
            borderLeft: '2px solid var(--accent-blue)',
            borderRight: '2px solid var(--accent-blue)',
            borderBottom: 'none',
            borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
            zIndex: 6,
          }}
        />

        <img
          ref={revealImgRef}
          src="/bg-dashboard.png"
          alt="Reveal effect"
          style={{
            position: 'absolute',
            width: '100%',
            top: '-50%',
            zIndex: 5,
            mixBlendMode: 'lighten',
            opacity: 0.3,
            pointerEvents: 'none',
            '--mx': '-9999px',
            '--my': '-9999px',
            WebkitMaskImage:
              'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.95) 60px, rgba(255,255,255,0.6) 120px, rgba(255,255,255,0.25) 180px, rgba(255,255,255,0) 240px)',
            maskImage:
              'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.95) 60px, rgba(255,255,255,0.6) 120px, rgba(255,255,255,0.25) 180px, rgba(255,255,255,0) 240px)',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
          } as React.CSSProperties}
        />
      </div>

      {/* ── Dashboard: Lower half of the rectangle ── */}
      <div
        style={{
          width: RECT_WIDTH,
          minHeight: `${DASHBOARD_HEIGHT}px`,
          margin: '0 auto',
          backgroundColor: 'var(--bg-elevated)',
          borderLeft: '2px solid var(--accent-blue)',
          borderRight: '2px solid var(--accent-blue)',
          borderBottom: '2px solid var(--accent-blue)',
          borderTop: 'none',
          borderRadius: '0 0 var(--radius-2xl) var(--radius-2xl)',
          position: 'relative',
          zIndex: 6,
        }}
      >
        {/* Dashboard content will go here */}
      </div>
    </div>
  );
}
