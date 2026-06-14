'use client';

import {
  Mail,
  Calendar,
  Keyboard,
  Shield,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    tag: 'Reads first',
    title: 'It reads everything first',
    description:
      'Pulls context from Gmail threads, calendar invites, and agent history before suggesting your next move.',
    visual: 'reading' as const,
  },
  {
    tag: 'Ranks actions',
    title: 'Picks the next step',
    description:
      'AI triage scores every thread. Urgent mail surfaces first so you reply to what matters.',
    visual: 'ranked' as const,
  },
  {
    tag: 'Confirms',
    title: 'Asks before acting',
    description:
      'The agent drafts replies and schedules events, then waits for your go-ahead. Nothing sends without you.',
    visual: 'confirm' as const,
  },
  {
    tag: 'Transparent',
    title: 'Shows every run',
    description:
      'Watch each step: read thread, match intent, draft reply. Full visibility into what the agent did.',
    visual: 'timeline' as const,
  },
];

function ReadingVisual() {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="flex items-center gap-2 rounded-full bg-bg-overlay px-3 py-1.5 text-[10px] font-medium text-accent-blue landing-float-sm">
        <Sparkles className="h-3 w-3 animate-pulse" />
        Reading content...
      </div>
      <div className="flex gap-2">
        {['Email', 'Calendar', 'Agent'].map((label) => (
          <div
            key={label}
            className="rounded-lg border border-border-subtle bg-bg-elevated/80 px-3 py-2 text-[10px] font-medium text-text-secondary landing-float-sm"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="h-px w-16 bg-border-default" />
      <div className="grid w-full grid-cols-3 gap-2">
        {['Gmail thread', 'Invite', 'Draft'].map((item) => (
          <div
            key={item}
            className="rounded-md bg-bg-surface px-2 py-1.5 text-[9px] text-text-muted landing-soft-inset"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function RankedVisual() {
  const actions = [
    { label: 'Reply with template', active: true },
    { label: 'Schedule from thread', active: false },
    { label: 'Archive thread', active: false },
  ];

  return (
    <div className="flex items-center gap-4 py-2">
      <div className="relative h-20 w-20 flex-shrink-0">
        <svg viewBox="0 0 80 80" className="h-full w-full">
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="var(--border-default)"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="var(--accent-blue)"
            strokeWidth="6"
            strokeDasharray="140 60"
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
            className="drop-shadow-sm"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-accent-blue">
          72%
        </span>
      </div>
      <div className="flex-1 space-y-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">
          Ranked actions
        </span>
        {actions.map((a) => (
          <div
            key={a.label}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px]',
              a.active ? 'bg-accent-blue/10 font-medium text-accent-blue' : 'text-text-muted'
            )}
          >
            {a.active && <CheckCircle2 className="h-3 w-3" />}
            {a.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfirmVisual() {
  return (
    <div className="relative flex items-center justify-center py-4">
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <svg viewBox="0 0 120 80" className="h-full w-full">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="60"
              y1="40"
              x2={60 + 40 * Math.cos((deg * Math.PI) / 180)}
              y2={40 + 40 * Math.sin((deg * Math.PI) / 180)}
              stroke="var(--border-default)"
              strokeWidth="0.5"
            />
          ))}
        </svg>
      </div>
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-elevated landing-soft-inset">
        <Shield className="h-7 w-7 text-accent-blue" />
      </div>
    </div>
  );
}

function TimelineVisual() {
  const steps = [
    { label: 'Read thread', status: 'done' },
    { label: 'Matched intent', status: 'done' },
    { label: 'Drafting reply', status: 'active' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 py-2">
      <div className="space-y-2">
        {steps.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-2 rounded-lg bg-bg-surface px-2.5 py-1.5 text-[10px] landing-float-sm"
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                s.status === 'done' ? 'bg-success' : 'bg-accent-blue animate-pulse'
              )}
            />
            <span className="text-text-secondary">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {['Gmail', 'Calendar', 'GitHub', 'Slack'].map((tool) => (
          <div
            key={tool}
            className="flex items-center justify-center rounded-lg bg-bg-surface py-2 text-[9px] font-medium text-text-muted landing-soft-raised"
          >
            {tool}
          </div>
        ))}
      </div>
    </div>
  );
}

const VISUALS = {
  reading: ReadingVisual,
  ranked: RankedVisual,
  confirm: ConfirmVisual,
  timeline: TimelineVisual,
};

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-24 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 grid gap-6 md:grid-cols-2 md:items-end">
          <div>
            <span className="landing-tag-glow inline-flex rounded-full bg-bg-elevated px-3 py-1 text-[11px] font-semibold text-accent-blue-dim">
              Features
            </span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
              Agents that do not just sit there.
            </h2>
          </div>
          <p className="text-[14px] leading-relaxed text-text-secondary">
            Pick a workflow and see how supereye turns everyday tasks into agents that
            run across your tools. Triage, draft, schedule, and confirm in one place.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {FEATURES.map((feature) => {
            const Visual = VISUALS[feature.visual];
            return (
              <article
                key={feature.title}
                className="flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated landing-float-sm transition-transform hover:-translate-y-0.5"
              >
                <div className="border-b border-border-subtle bg-bg-surface/50 px-5 py-4">
                  <Visual />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-accent-blue-dim">
                    {feature.tag}
                  </span>
                  <h3 className="font-heading text-[17px] font-bold text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-text-secondary">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* Keyboard + extras row */}
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Keyboard,
              title: 'Keyboard first',
              text: 'Every action mapped. Command palette, compose, archive, navigate. Press D to toggle theme.',
            },
            {
              icon: Mail,
              title: 'Unified inbox',
              text: 'Gmail sync with labels, search, and AI priority tiers. Urgent and can-wait filters built in.',
            },
            {
              icon: Calendar,
              title: 'Calendar in context',
              text: 'Create events from email threads. Check availability without leaving the reader pane.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border-subtle bg-bg-elevated p-5 landing-float-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/10 text-accent-blue landing-soft-raised">
                <item.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-3 font-heading text-[15px] font-bold text-text-primary">
                {item.title}
              </h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-text-secondary">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
