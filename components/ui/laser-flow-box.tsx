'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import LaserFlow from './LaserFlow';
import { MockDashboard } from '@/components/landing/mock-dashboard';

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
 * Layout strategy (matches the reference: the laser FALLS ON the dashboard):
 *
 * ┌───────────────────────────────────────┐
 * │            LaserFlow (hero)            │  ← overflow:hidden, WebGL canvas
 * │                  ║                     │     beam descends from the top…
 * │                  ▼                     │
 * │        ┌───────────────────┐           │  ← …and its bright horizontal bloom
 * │ ═══════╪═══════════════════╪═══════    │     lands exactly on the dashboard's
 * │        │   Dashboard       │           │     top edge (light spills onto it).
 * └────────┼───────────────────┼───────────┘
 *          │  (full content)   │              The dashboard is a SINGLE bordered
 *          │                   │              box pulled UP into the beam via a
 *          └───────────────────┘              negative top margin — no fake halves,
 *                                             no seam, no clipped content.
 *
 * Tunables:
 *   HERO_HEIGHT       – height of the laser canvas area
 *   DASHBOARD_HEIGHT  – fixed height of the dashboard showcase (full content)
 *   OVERLAP           – how far the dashboard rises into the beam. Set so its
 *                       top edge meets the beam's bloom (~0.55 * HERO_HEIGHT).
 */

const RECT_WIDTH = '86%';
const HERO_HEIGHT = 640;       // px – laser beam descent area
const DASHBOARD_HEIGHT = 600;  // px – full dashboard showcase area
const OVERLAP = 290;           // px – dashboard rises this far into the beam

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

      {/* ── Dashboard: a single bordered box pulled UP into the beam ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: RECT_WIDTH,
          height: `${DASHBOARD_HEIGHT}px`,
          margin: `${-OVERLAP}px auto 96px`,
          backgroundColor: 'var(--bg-elevated)',
          border:
            '1px solid color-mix(in srgb, var(--accent-blue) 45%, transparent)',
          borderRadius: 'var(--radius-2xl)',
          overflow: 'hidden',
          boxShadow:
            '0 -2px 60px color-mix(in srgb, var(--accent-blue) 30%, transparent), 0 30px 80px rgba(0,0,0,0.55)',
        }}
      >
        {/* Light spilling onto the top of the dashboard (where the beam lands) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20"
          style={{
            height: '180px',
            background:
              'radial-gradient(ellipse 55% 130% at 50% 0%, color-mix(in srgb, var(--accent-blue) 38%, transparent), transparent 72%)',
          }}
        />
        {/* Bright top edge highlight – the laser's contact line */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20"
          style={{
            height: '2px',
            background:
              'linear-gradient(90deg, transparent, var(--accent-blue) 25%, color-mix(in srgb, var(--accent-blue) 90%, white) 50%, var(--accent-blue) 75%, transparent)',
            boxShadow:
              '0 0 22px 3px color-mix(in srgb, var(--accent-blue) 70%, transparent)',
          }}
        />

        <MockDashboard />
      </div>
    </div>
  );
}
