'use client';

import { LandingSection, SectionHeader } from './landing-section';
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid';
import { BentoEmailList } from './bento-email-list';
import { BentoSonnerDemo } from './bento-sonner-demo';
import { BentoIntegrationsBeam } from './bento-integrations-beam';
import { BentoCalendarPreview } from './bento-calendar-preview';

const features = [
  {
    name: 'Unified inbox',
    description:
      'Gmail threads and calendar context in one view. See the email that spawned every meeting.',
    href: '/login',
    cta: 'Open workspace',
    className: 'col-span-3 lg:col-span-1 lg:row-span-2 min-h-[36rem]',
    background: <BentoEmailList />,
  },
  {
    name: 'Integrations',
    description:
      'Gmail, Google Calendar, and GitHub — connected through Corsair. OAuth, webhooks, and sync handled for you.',
    href: '/login',
    cta: 'Connect apps',
    className: 'col-span-3 lg:col-span-2 min-h-[18rem]',
    background: <BentoIntegrationsBeam />,
  },
  {
    name: 'AI triage & alerts',
    description:
      'Get notified when something urgent lands. AI sorts urgent vs. can-wait so you focus first.',
    href: '#features',
    cta: 'See triage',
    className: 'col-span-3 lg:col-span-1 min-h-[18rem]',
    background: <BentoSonnerDemo />,
  },
  {
    name: 'Calendar sync',
    description:
      'Filter your day by date. One-click scheduling turns any email thread into a calendar event.',
    href: '/login',
    cta: 'Sync calendar',
    className: 'col-span-3 lg:col-span-1 min-h-[18rem]',
    background: <BentoCalendarPreview />,
  },
];

export function LandingBento() {
  return (
    <LandingSection id="features" className="bg-bg-app">
      <SectionHeader
        eyebrow="Features"
        title="Everything you need, nothing you don't"
        description="A keyboard-first productivity shell that unifies Gmail, Calendar, and AI into one opinionated workspace."
      />

      <BentoGrid>
        {features.map((feature) => (
          <BentoCard key={feature.name} {...feature} />
        ))}
      </BentoGrid>
    </LandingSection>
  );
}
