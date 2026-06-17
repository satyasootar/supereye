'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LandingSection } from './landing-section';
import React, { useRef, useEffect, useCallback } from 'react';

interface Dot {
  cx: number;
  cy: number;
  xOffset: number;
  yOffset: number;
  vx: number;
  vy: number;
}

function parseHex(hex: string) {
  const cleanHex = hex.replace('#', '').trim();
  // Handle 3-digit hex codes
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 90, g: 119, b: 92 }; // fallback green
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function LandingCta() {
  const reduceMotion = useReducedMotion();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointerRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
    isHovered: false,
    clickX: -9999,
    clickY: -9999,
    clickTime: 0,
  });

  const dotSize = 3;
  const gap = 16;
  const proximity = 120;
  const speedTrigger = 80;
  const shockRadius = 220;
  const shockStrength = 12;

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;

    const extraX = width - gridW;
    const extraY = height - gridH;

    const startX = extraX / 2 + dotSize / 2;
    const startY = extraY / 2 + dotSize / 2;

    const dots: Dot[] = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = startX + x * cell;
        const cy = startY + y * cell;
        dots.push({ cx, cy, xOffset: 0, yOffset: 0, vx: 0, vy: 0 });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  useEffect(() => {
    buildGrid();
    const ro = new ResizeObserver(buildGrid);
    if (wrapperRef.current) {
      ro.observe(wrapperRef.current);
    }
    return () => {
      ro.disconnect();
    };
  }, [buildGrid]);

  useEffect(() => {
    let rafId: number;
    let lastClickTime = 0;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pr = pointerRef.current;
      const dots = dotsRef.current;

      // Handle shockwave on click
      if (pr.clickTime > lastClickTime) {
        const cx = pr.clickX;
        const cy = pr.clickY;
        for (const dot of dots) {
          const dx = dot.cx + dot.xOffset - cx;
          const dy = dot.cy + dot.yOffset - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < shockRadius) {
            const falloff = Math.max(0, 1 - dist / shockRadius);
            const push = shockStrength * falloff;
            const angle = Math.atan2(dy, dx);
            dot.vx += Math.cos(angle) * push;
            dot.vy += Math.sin(angle) * push;
          }
        }
        lastClickTime = pr.clickTime;
      }

      // Handle hover proximity push
      if (pr.isHovered) {
        const px = pr.x;
        const py = pr.y;
        for (const dot of dots) {
          const dx = dot.cx + dot.xOffset - px;
          const dy = dot.cy + dot.yOffset - py;
          const dist = Math.hypot(dx, dy);
          if (dist < proximity && pr.speed > speedTrigger) {
            const falloff = Math.max(0, 1 - dist / proximity);
            const push = (pr.speed * 0.0035) * falloff;
            const angle = Math.atan2(dy, dx);
            dot.vx += Math.cos(angle) * push;
            dot.vy += Math.sin(angle) * push;
          }
        }
      }

      // Spring physics updates & draw
      const k = 0.06; // spring tension
      const damping = 0.88; // friction
      const radius = dotSize / 2;

      // Resolve theme accent color dynamically
      const accentHex = typeof window !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--accent-blue').trim()
        : '#5A775C';
      
      const rgb = parseHex(accentHex || '#5A775C');
      const proxSq = proximity * proximity;

      for (const dot of dots) {
        const ax = -k * dot.xOffset;
        const ay = -k * dot.yOffset;

        dot.vx = (dot.vx + ax) * damping;
        dot.vy = (dot.vy + ay) * damping;

        dot.xOffset += dot.vx;
        dot.yOffset += dot.vy;

        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;

        // Calculate proximity color/opacity glow
        const dx = dot.cx - pr.x;
        const dy = dot.cy - pr.y;
        const dsq = dx * dx + dy * dy;

        let fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.06)`; // default extremely faint state
        if (pr.isHovered && dsq <= proxSq) {
          const dist = Math.sqrt(dsq);
          const t = 1 - dist / proximity;
          
          // Blend with white to create a glowing effect under the cursor
          const r = Math.round(rgb.r + (255 - rgb.r) * t * 0.25);
          const g = Math.round(rgb.g + (255 - rgb.g) * t * 0.25);
          const b = Math.round(rgb.b + (255 - rgb.b) * t * 0.25);
          const opacity = 0.06 + t * 0.24; // max 0.30 opacity near cursor
          fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }

        ctx.beginPath();
        ctx.arc(ox, oy, radius, 0, Math.PI * 2);
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [dotSize, proximity, speedTrigger, shockRadius, shockStrength]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const now = performance.now();
    const pr = pointerRef.current;
    const dt = pr.lastTime ? now - pr.lastTime : 16;
    const dx = px - pr.lastX;
    const dy = py - pr.lastY;

    let vx = (dx / Math.max(dt, 1)) * 1000;
    let vy = (dy / Math.max(dt, 1)) * 1000;
    const speed = Math.hypot(vx, vy);

    pr.x = px;
    pr.y = py;
    pr.vx = vx;
    pr.vy = vy;
    pr.speed = speed;
    pr.lastTime = now;
    pr.lastX = px;
    pr.lastY = py;
    pr.isHovered = true;
  };

  const handleMouseLeave = () => {
    pointerRef.current.isHovered = false;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    pointerRef.current.clickX = px;
    pointerRef.current.clickY = py;
    pointerRef.current.clickTime = performance.now();
  };

  return (
    <LandingSection className="py-16 md:py-20">
      <motion.div
        ref={wrapperRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[color-mix(in_srgb,var(--accent-blue)_30%,transparent)] bg-bg-elevated px-8 py-14 text-center md:px-16 md:py-16 select-none"
      >
        {/* Dot Grid Background */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-2"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 50% 100%, color-mix(in srgb, var(--accent-blue) 14%, transparent), transparent 65%)',
          }}
        />

        <div className="relative z-10">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
            Ready to see your whole day?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-text-secondary">
            Join power users who run their entire workday from one intelligent workspace. Plans start at $20/month.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2 px-8">
              <Link href="/login">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#features">Explore features</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </LandingSection>
  );
}
