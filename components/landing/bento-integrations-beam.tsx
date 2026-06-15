'use client';

import { forwardRef, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AnimatedBeam } from '@/components/ui/bento-grid';
import { AiBot } from '@/components/os/ai-bot';
import { PluginBrandIcon } from '@/components/onboarding/plugin-brand-icon';

const LogoCircle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => (
  <div
    ref={ref}
    className={cn(
      'z-10 flex size-14 shrink-0 items-center justify-center rounded-full border border-border-default bg-bg-elevated p-3 shadow-md',
      className
    )}
  >
    {children}
  </div>
));
LogoCircle.displayName = 'LogoCircle';

const FeaturePill = forwardRef<
  HTMLDivElement,
  { label: string }
>(({ label }, ref) => (
  <div
    ref={ref}
    className="z-10 flex h-11 min-w-[5.5rem] items-center justify-center rounded-full border border-border-default bg-bg-elevated px-4 text-[12px] font-semibold text-text-primary shadow-md"
  >
    {label}
  </div>
));
FeaturePill.displayName = 'FeaturePill';

interface BentoIntegrationsBeamProps {
  className?: string;
}

export function BentoIntegrationsBeam({ className }: BentoIntegrationsBeamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const gmailRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const githubRef = useRef<HTMLDivElement>(null);
  const syncRef = useRef<HTMLDivElement>(null);
  const triageRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute inset-0 flex items-center justify-center px-4 pt-1 sm:px-8',
        className
      )}
    >
      <div className="flex w-full max-w-2xl items-center justify-between gap-4 sm:gap-8">
        {/* Left — source integrations */}
        <div className="flex flex-col gap-4 sm:gap-5">
          <LogoCircle ref={gmailRef}>
            <PluginBrandIcon pluginId="email" size={30} />
          </LogoCircle>
          <LogoCircle ref={calendarRef}>
            <PluginBrandIcon pluginId="calendar" size={30} />
          </LogoCircle>
          <LogoCircle ref={githubRef}>
            <PluginBrandIcon pluginId="github" size={30} />
          </LogoCircle>
        </div>

        {/* Center — Supereye bot */}
        <div
          ref={centerRef}
          className="z-10 flex size-[4.5rem] shrink-0 items-center justify-center rounded-full border-2 border-accent-blue/40 bg-bg-elevated shadow-[0_0_32px_color-mix(in_srgb,var(--accent-blue)_25%,transparent)] sm:size-20"
        >
          <AiBot
            openAgentOnClick={false}
            hideWhenAgentOpen={false}
            disableClick
            size="md"
          />
        </div>

        {/* Right — output features */}
        <div className="flex flex-col gap-4 sm:gap-5">
          <FeaturePill ref={syncRef} label="Sync" />
          <FeaturePill ref={triageRef} label="Triage" />
          <FeaturePill ref={draftRef} label="Draft" />
        </div>
      </div>

      {/* Left → center */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={gmailRef}
        toRef={centerRef}
        curvature={-50}
        startXOffset={8}
        endXOffset={-12}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={calendarRef}
        toRef={centerRef}
        curvature={0}
        delay={0.3}
        startXOffset={8}
        endXOffset={-12}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={githubRef}
        toRef={centerRef}
        curvature={50}
        delay={0.6}
        startXOffset={8}
        endXOffset={-12}
      />

      {/* Center → right */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={syncRef}
        curvature={-50}
        delay={0.2}
        startXOffset={12}
        endXOffset={-8}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={triageRef}
        curvature={0}
        delay={0.5}
        startXOffset={12}
        endXOffset={-8}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={centerRef}
        toRef={draftRef}
        curvature={50}
        delay={0.8}
        startXOffset={12}
        endXOffset={-8}
      />
    </div>
  );
}
