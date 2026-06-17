'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import LaserFlow from './LaserFlow';
import { MockDashboard } from '@/components/landing/mock-dashboard';

function useCssVar(name: string) {
  const { resolvedTheme } = useTheme();
  const [value, setValue] = useState('');

  useEffect(() => {
    const update = () => {
      setValue(
        getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      );
    };
    update();
    window.addEventListener('color-theme-change', update);
    return () => window.removeEventListener('color-theme-change', update);
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
const HERO_HEIGHT = 1200;       // px – laser beam descent area
const DASHBOARD_HEIGHT = 700;  // px – full dashboard showcase area
const OVERLAP = 595;           // px – dashboard rises this far into the beam

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
            el.style.setProperty('--my', `${y}px`);
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
          horizontalSizing={1}
          verticalSizing={15}
          wispDensity={2}
          wispSpeed={15}
          wispIntensity={30}
          flowSpeed={0.35}
          flowStrength={0.5}
          fogIntensity={0.9}
          fogScale={0.4}
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
            height: '100%',
            objectFit: 'cover',
            top: '0px',
            left: '0px',
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

        {/* ── Left Content Overlay ── */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '7%',
            maxWidth: '40%',
            zIndex: 8,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <h1
            style={{
              fontSize: '3.75rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
          >
            Your Entire Work Life,<br />
            <span style={{ color: 'var(--accent-blue)' }}>One Eye Away.</span>
          </h1>
          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '460px',
            }}
          >
            Supereye brings your email, calendar, and favourite tools into one intelligent workspace. Plug in the apps you already use, let AI handle the rest, and run your entire workday from a single place.
          </p>
          <div style={{ pointerEvents: 'auto', marginTop: '8px' }}>
            <Link
              href="/login"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: 'var(--accent-blue)',
                color: 'var(--text-inverse)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
            >
              Get started
            </Link>
          </div>
        </div>
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
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow:
            '0 -40px 60px -40px color-mix(in srgb, var(--accent-blue) 30%, transparent), 0 30px 80px rgba(0,0,0,0.55)',
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
