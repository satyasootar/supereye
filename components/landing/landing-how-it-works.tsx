'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Quote, Link2, Zap } from 'lucide-react';

const STEPS = [
  {
    icon: Quote,
    title: 'Describe it',
    subtitle: 'Type the workflow in plain English.',
    visual: 'terminal' as const,
  },
  {
    icon: Link2,
    title: 'Connect apps',
    subtitle: 'Plug in Gmail, Calendar, GitHub, and Slack.',
    visual: 'plug' as const,
  },
  {
    icon: Zap,
    title: 'Let it run',
    subtitle: 'Runs the workflow in the background.',
    visual: 'running' as const,
  },
];

function TerminalVisual() {
  return (
    <div className="mx-auto w-full max-w-[180px] rounded-xl bg-bg-elevated p-3 landing-soft-inset">
      <p className="font-mono text-[11px] text-accent-blue">
        &gt; triage inbox, draft replies_
      </p>
      <p className="mt-1 font-mono text-[9px] text-text-muted">Type to build</p>
    </div>
  );
}

function PlugVisual() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const apps = [
    { src: '/Icons/slack.svg', style: 'left-[8%] top-[65%]', delay: '0s' },
    {
      src: isDark ? '/Icons/github/GitHub_dark.svg' : '/Icons/github/GitHub_light.svg',
      style: 'left-[5%] top-[18%]',
      delay: '0.5s',
    },
    { src: '/Icons/gmail.svg', style: 'right-[8%] top-[5%]', delay: '1s' },
    { src: '/Icons/google-calendar.svg', style: 'right-[5%] bottom-[8%]', delay: '1.5s' },
  ];

  return (
    <div className="relative mx-auto h-[140px] w-full max-w-[200px]">
      {/* Connector lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 140">
        <path
          d="M100 70 L40 100"
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="1"
          className="landing-pulse-line"
        />
        <path
          d="M100 70 L35 35"
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="1"
          className="landing-pulse-line"
          style={{ animationDelay: '0.5s' }}
        />
        <path
          d="M100 70 L165 25"
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="1"
          className="landing-pulse-line"
          style={{ animationDelay: '1s' }}
        />
        <path
          d="M100 70 L170 115"
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="1"
          className="landing-pulse-line"
          style={{ animationDelay: '1.5s' }}
        />
      </svg>

      {/* Central plug */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-16 w-14 flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-elevated landing-soft-raised">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-blue/15">
              <Link2 className="h-4 w-4 text-accent-blue" />
            </div>
          </div>
          <div className="mt-1 h-6 w-3 rounded-b-md bg-bg-overlay landing-soft-inset" />
        </div>
      </div>

      {/* Floating app icons */}
      {apps.map((app) => (
        <div
          key={app.src}
          className={`landing-float-icon absolute flex h-9 w-9 items-center justify-center rounded-full bg-bg-elevated landing-float-sm ${app.style}`}
          style={{ animationDelay: app.delay }}
        >
          <Image src={app.src} alt="" width={20} height={20} className="object-contain" />
        </div>
      ))}
    </div>
  );
}

function RunningVisual() {
  return (
    <div className="mx-auto w-full max-w-[200px]">
      <div className="rounded-2xl bg-bg-elevated px-6 py-4 text-center landing-soft-raised">
        <span className="text-[13px] font-semibold tracking-wide text-text-muted">
          Running
        </span>
      </div>
      <div className="mx-auto mt-2 h-2 w-16 rounded-full bg-bg-overlay landing-soft-inset" />
    </div>
  );
}

const STEP_VISUALS = {
  terminal: TerminalVisual,
  plug: PlugVisual,
  running: RunningVisual,
};

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="landing-tag-glow inline-flex rounded-full bg-bg-elevated px-3 py-1 text-[11px] font-semibold text-accent-blue-dim">
            How it works
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            From idea to agent in three steps.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => {
            const Visual = STEP_VISUALS[step.visual];
            return (
              <article
                key={step.title}
                className="flex flex-col items-center rounded-2xl border border-border-subtle bg-bg-elevated p-6 text-center landing-float-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue text-text-inverse landing-soft-raised">
                  <step.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 font-heading text-[16px] font-bold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-1 text-[12px] text-text-secondary">{step.subtitle}</p>
                <div className="mt-6 w-full">
                  <Visual />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
