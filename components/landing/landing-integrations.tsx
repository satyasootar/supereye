'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';

const INTEGRATION_APPS = [
  { name: 'Gmail', src: '/Icons/gmail.svg' },
  { name: 'Calendar', src: '/Icons/google-calendar.svg' },
  { name: 'GitHub', srcLight: '/Icons/github/GitHub_light.svg', srcDark: '/Icons/github/GitHub_dark.svg' },
  { name: 'Slack', src: '/Icons/slack.svg' },
];

const WORKFLOWS = [
  'Triage inbox by urgency',
  'Draft reply from thread',
  'Schedule event from email',
  'Sync calendar availability',
  'Review PR notifications',
  'Archive low-priority mail',
];

export function LandingIntegrations() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const trackIcons = [
    '/Icons/gmail.svg',
    '/Icons/google-calendar.svg',
    isDark ? '/Icons/github/GitHub_dark.svg' : '/Icons/github/GitHub_light.svg',
    '/Icons/slack.svg',
    '/Icons/gmail.svg',
    '/Icons/google-calendar.svg',
  ];

  return (
    <section id="integrations" className="scroll-mt-24 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <span className="landing-tag-glow inline-flex rounded-full bg-bg-elevated px-3 py-1 text-[11px] font-semibold text-accent-blue-dim">
            Integrations
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-text-primary md:text-4xl">
            See what supereye can automate.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-text-secondary">
            Connect Gmail and Google Calendar today. GitHub and Slack plug into the same
            workspace through Corsair. One hub, every tool.
          </p>
        </div>

        {/* Central plug hub */}
        <div className="relative mx-auto mb-10 max-w-3xl">
          {/* Horizontal track */}
          <div className="absolute left-0 right-0 top-1/2 z-0 h-14 -translate-y-1/2 rounded-full bg-bg-surface/80 landing-soft-inset" />

          {/* Connector ends */}
          <div className="absolute left-0 top-1/2 z-0 h-10 w-8 -translate-y-1/2 rounded-l-lg bg-bg-elevated landing-soft-raised" />
          <div className="absolute right-0 top-1/2 z-0 h-10 w-8 -translate-y-1/2 rounded-r-lg bg-bg-elevated landing-soft-raised" />

          {/* Track icons */}
          <div className="relative z-10 flex items-center justify-between px-12 py-8">
            {trackIcons.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-elevated landing-float-sm transition-transform hover:-translate-y-1"
              >
                <Image src={src} alt="" width={22} height={22} className="object-contain" />
              </div>
            ))}
          </div>

          {/* Central hub */}
          <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
            <svg className="absolute -inset-16 h-[calc(100%+128px)] w-[calc(100%+128px)]" viewBox="0 0 200 200">
              <line x1="100" y1="20" x2="100" y2="60" stroke="var(--border-default)" strokeWidth="0.5" />
              <line x1="100" y1="140" x2="100" y2="180" stroke="var(--border-default)" strokeWidth="0.5" />
              <line x1="20" y1="100" x2="60" y2="100" stroke="var(--border-default)" strokeWidth="0.5" />
              <line x1="140" y1="100" x2="180" y2="100" stroke="var(--border-default)" strokeWidth="0.5" />
            </svg>

            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-bg-elevated landing-float">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-bg-surface landing-soft-inset">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/15">
                  <Image
                    src="/Icons/gmail.svg"
                    alt=""
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Radiating app icons */}
        <div className="relative mx-auto mb-10 h-[200px] max-w-lg">
          {[
            { src: '/Icons/slack.svg', className: 'left-[5%] top-[20%]' },
            {
              src: isDark ? '/Icons/github/GitHub_dark.svg' : '/Icons/github/GitHub_light.svg',
              className: 'left-[15%] bottom-[10%]',
            },
            { src: '/Icons/gmail.svg', className: 'right-[10%] top-[5%]' },
            { src: '/Icons/google-calendar.svg', className: 'right-[5%] bottom-[15%]' },
          ].map((app, i) => (
            <div
              key={i}
              className={`landing-float-icon absolute flex h-12 w-12 items-center justify-center rounded-full bg-bg-elevated landing-float-sm ${app.className}`}
              style={{ animationDelay: `${i * 0.6}s` }}
            >
              <Image src={app.src} alt="" width={26} height={26} className="object-contain" />
              <svg className="absolute -z-10 h-24 w-24" viewBox="0 0 96 96">
                <path
                  d="M48 48 L80 20"
                  fill="none"
                  stroke="var(--border-default)"
                  strokeWidth="0.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          ))}
        </div>

        {/* Pill buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {INTEGRATION_APPS.map((app) => {
            const src =
              'src' in app
                ? app.src
                : isDark
                  ? app.srcDark
                  : app.srcLight;
            return (
              <button
                key={app.name}
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-elevated px-4 py-2 text-[12px] font-medium text-text-secondary transition-all landing-float-sm hover:-translate-y-0.5 hover:text-text-primary"
              >
                <Image src={src!} alt="" width={16} height={16} className="object-contain" />
                {app.name}
              </button>
            );
          })}
          <button
            type="button"
            className="rounded-full border border-dashed border-border-default bg-bg-surface px-4 py-2 text-[12px] font-medium text-text-muted transition-colors hover:text-text-secondary"
          >
            + More
          </button>
        </div>

        {/* Workflow pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {WORKFLOWS.map((wf) => (
            <span
              key={wf}
              className="rounded-full bg-bg-surface px-3 py-1.5 text-[11px] text-text-muted landing-soft-inset"
            >
              {wf}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
