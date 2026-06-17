import { MAX_PLUGINS_PER_WORKSPACE } from '@/lib/plugins/registry';
import type { TourTargetId } from '@/lib/tour/targets';

export type TourStepPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export type AppTourStep = {
  id: string;
  title: string;
  /** Use `{mod}` for Ctrl/⌘ and `{maxPlugins}` for workspace plugin limit. */
  body: string;
  target?: TourTargetId;
  placement?: TourStepPlacement;
  requiresTwoPlugins?: boolean;
  requiresSecondary?: boolean;
};

export const APP_TOUR_STEPS: AppTourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Supereye',
    body: 'This quick tour shows how the workspace is laid out — where tools live, how to switch between them, and how eye and keyboard shortcuts fit in. You can skip anytime or follow every step.',
    placement: 'center',
  },
  {
    id: 'workspace',
    title: 'What is a workspace?',
    target: 'workspace-switcher',
    placement: 'bottom',
    body: 'A workspace is a saved layout of your connected tools. Switch workspaces here or press 1–5 on your keyboard. Each workspace remembers which plugins you want side by side.',
  },
  {
    id: 'plugin-limit',
    title: `Up to ${MAX_PLUGINS_PER_WORKSPACE} plugins per workspace`,
    target: 'workspace-switcher',
    placement: 'bottom',
    body: `Each workspace holds at most {maxPlugins} plugins: one main panel (where you work) and one optional sidebar plugin. Connect Email, Calendar, GitHub, and Drive in onboarding or Profile → Connections.`,
  },
  {
    id: 'plugin-switch',
    title: 'Switch the active plugin',
    target: 'plugin-switch',
    placement: 'right',
    requiresTwoPlugins: true,
    body: 'When a workspace has two plugins, press Tab or click this button to swap which one fills the main panel. The other moves to the compact side panel.',
  },
  {
    id: 'plugin-nav',
    title: 'Plugin navigation',
    target: 'plugin-nav',
    placement: 'right',
    body: 'The left sidebar adapts to your active plugin — inbox folders for email, calendar views, GitHub repos, or Drive folders. This is your primary navigation within a tool.',
  },
  {
    id: 'main-panel',
    title: 'Main panel',
    target: 'main-panel',
    placement: 'left',
    body: 'Your focused work happens here: reading mail, scanning your calendar, reviewing pull requests, or browsing files. It updates when you switch plugins or workspaces.',
  },
  {
    id: 'secondary-panel',
    title: 'Secondary panel',
    target: 'secondary-panel',
    placement: 'left',
    requiresSecondary: true,
    body: 'With two plugins in a workspace, the second one lives here as a compact companion — glance at your calendar while emailing, or keep GitHub inbox visible beside mail.',
  },
  {
    id: 'brief',
    title: 'Today brief',
    target: 'brief',
    placement: 'bottom',
    body: 'Open Today for an AI-powered daily snapshot: urgent mail, schedule highlights, and what needs attention across your connected tools.',
  },
  {
    id: 'eye',
    title: 'Meet eye',
    target: 'eye',
    placement: 'top',
    body: 'eye is your built-in AI assistant. Click the floating bot or press {mod}+J to open a chat — draft emails, schedule meetings, search across tools, and get guided help.',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    target: 'notifications',
    placement: 'top',
    body: 'New mail and important updates appear here in real time. Click a notification to jump straight to the relevant email or item.',
  },
  {
    id: 'profile',
    title: 'Profile & settings',
    target: 'profile',
    placement: 'top',
    body: 'Manage integrations, workspaces, keybindings, billing, and eye preferences. You can replay this tour anytime from the profile menu.',
  },
  {
    id: 'complete',
    title: "You're ready to go",
    placement: 'center',
    body: 'That covers the essentials. Explore at your own pace — press ? whenever you need shortcuts, and {mod}+K to jump anywhere. Happy productivity!',
  },
];

export function filterTourSteps(options: {
  hasTwoPlugins: boolean;
  hasSecondary: boolean;
}): AppTourStep[] {
  return APP_TOUR_STEPS.filter((step) => {
    if (step.requiresTwoPlugins && !options.hasTwoPlugins) return false;
    if (step.requiresSecondary && !options.hasSecondary) return false;
    return true;
  });
}

export function interpolateTourText(
  text: string,
  values: { mod: string; maxPlugins: number }
): string {
  return text
    .replace(/\{mod\}/g, values.mod)
    .replace(/\{maxPlugins\}/g, String(values.maxPlugins));
}
