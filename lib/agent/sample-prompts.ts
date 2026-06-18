export type SamplePrompt = {
  id: string;
  label: string;
  prompt: string;
  hint?: string;
};

export type SamplePromptGroup = {
  id: string;
  label: string;
  /** Maps to PluginBrandIcon plugin ids: email, calendar, github, drive */
  iconPluginId: 'email' | 'calendar' | 'github' | 'drive';
  description: string;
  samples: SamplePrompt[];
};

const EXAMPLE_EMAIL = 'satya.sootar01@gmail.com';

export const AGENT_SAMPLE_GROUPS: SamplePromptGroup[] = [
  {
    id: 'email-calendar',
    label: 'Email & Calendar',
    iconPluginId: 'email',
    description: 'Send mail, schedule events, and add Google Meet links',
    samples: [
      {
        id: 'meeting-meet',
        label: 'Meeting + Google Meet',
        hint: 'Email + calendar + Meet',
        prompt: `Send a mail to ${EXAMPLE_EMAIL} about an office work meeting. Create an event today at 6pm IST, assign him, add Google Meet, and include the link in the email.`,
      },
      {
        id: 'follow-up',
        label: 'Follow-up email',
        hint: 'Professional check-in',
        prompt: `Draft a polite follow-up email to ${EXAMPLE_EMAIL} regarding the office work meeting. Ask if he received the invite and confirm his availability for today at 6:00 PM IST.`,
      },
      {
        id: 'agenda-today',
        label: "Today's agenda",
        hint: 'Calendar overview',
        prompt: `Show my calendar events for today and draft a short summary email to ${EXAMPLE_EMAIL} with the meeting schedule.`,
      },
    ],
  },
  {
    id: 'drive',
    label: 'Google Drive',
    iconPluginId: 'drive',
    description: 'Find, share, and organize files',
    samples: [
      {
        id: 'share-doc',
        label: 'Share doc by email',
        hint: 'Drive + email combo',
        prompt: `Find my most recent document in Google Drive and email ${EXAMPLE_EMAIL} with a link to it. Mention it's related to our office work meeting.`,
      },
      {
        id: 'recent-files',
        label: 'Recent files',
        hint: 'Browse Drive',
        prompt: 'List my 5 most recent files in Google Drive and summarize what each one is about.',
      },
      {
        id: 'meeting-notes',
        label: 'Meeting notes folder',
        hint: 'Search + organize',
        prompt: `Search Google Drive for files related to "office work meeting" and share the best match with ${EXAMPLE_EMAIL} via email.`,
      },
    ],
  },
  {
    id: 'github',
    label: 'GitHub',
    iconPluginId: 'github',
    description: 'Pull requests, issues, and repo updates',
    samples: [
      {
        id: 'open-prs',
        label: 'Open pull requests',
        hint: 'PR summary',
        prompt: 'List my open pull requests across repositories and summarize which ones need my attention today.',
      },
      {
        id: 'pr-email',
        label: 'PR update via email',
        hint: 'GitHub + email combo',
        prompt: `Check my latest open pull request and email ${EXAMPLE_EMAIL} a brief status update on the review progress and next steps.`,
      },
      {
        id: 'create-issue',
        label: 'Create issue',
        hint: 'Track a task',
        prompt: 'Create a GitHub issue titled "Office work meeting follow-up" with a checklist for agenda, attendees, and action items from today\'s 6pm IST meeting.',
      },
    ],
  },
];

export type QuickSample = SamplePrompt & {
  service: SamplePromptGroup['iconPluginId'];
};

const ALL_QUICK_SAMPLES: QuickSample[] = AGENT_SAMPLE_GROUPS.flatMap((group) =>
  group.samples.map((sample) => ({ ...sample, service: group.iconPluginId }))
);

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function pickQuickSamples(count: number, excludeIds: string[] = []): QuickSample[] {
  const excluded = new Set(excludeIds);
  const available = ALL_QUICK_SAMPLES.filter((sample) => !excluded.has(sample.id));
  const pool = available.length >= count ? available : ALL_QUICK_SAMPLES;
  return shuffle(pool).slice(0, count);
}

export function fillAgentInput(text: string) {
  window.dispatchEvent(new CustomEvent('agent:fill-input', { detail: { text } }));
  window.dispatchEvent(new Event('agent:focus-input'));
}
