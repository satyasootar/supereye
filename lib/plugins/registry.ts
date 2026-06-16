import type { PluginDefinition, PluginId } from '@/lib/plugins/types';

/**
 * Single source of truth for workspace plugins.
 * To add a new plugin: append one entry here — layout engine and UI derive from this list.
 */
export const PLUGIN_REGISTRY: PluginDefinition[] = [
  {
    id: 'email',
    corsairPlugin: 'gmail',
    label: 'Gmail',
    shortLabel: 'Gmail',
    description: 'Inbox, compose, and manage email without leaving your workspace.',
    matchers: ['gmail'],
    availableInOnboarding: true,
    order: 0,
  },
  {
    id: 'calendar',
    corsairPlugin: 'googlecalendar',
    label: 'Google Calendar',
    shortLabel: 'Calendar',
    description: 'Schedules, events, and availability in one view.',
    matchers: ['googlecalendar', 'google_calendar', 'calendar'],
    availableInOnboarding: true,
    order: 1,
  },
  {
    id: 'github',
    corsairPlugin: 'github',
    label: 'GitHub',
    shortLabel: 'GitHub',
    description: 'Pull requests, issues, and repo activity alongside your work.',
    matchers: ['github'],
    availableInOnboarding: true,
    order: 2,
  },
  {
    id: 'drive',
    corsairPlugin: 'googledrive',
    label: 'Google Drive',
    shortLabel: 'Drive',
    description: 'Browse, search, and open files without leaving your workspace.',
    matchers: ['googledrive', 'google_drive', 'drive'],
    availableInOnboarding: true,
    order: 3,
  },
];

export const MAX_PLUGINS_PER_WORKSPACE = 2;

export const PLUGIN_IDS = PLUGIN_REGISTRY.map((p) => p.id) as PluginId[];

export function workspacePluginIds(
  primary: PluginId,
  sidebar: PluginId | null
): PluginId[] {
  if (!sidebar || sidebar === primary) return [primary];
  return [primary, sidebar];
}

export function generateWorkspaceName(pluginIds: PluginId[]): string {
  return pluginIds
    .map((id) => getPlugin(id)?.shortLabel ?? id)
    .join(' + ');
}

export function getPlugin(id: PluginId): PluginDefinition | undefined {
  return PLUGIN_REGISTRY.find((p) => p.id === id);
}

export function getPluginByCorsairName(name: string): PluginDefinition | undefined {
  const normalized = name.toLowerCase();
  return PLUGIN_REGISTRY.find((p) =>
    p.matchers.some((m) => normalized.includes(m))
  );
}

export function getOnboardingPlugins(): PluginDefinition[] {
  return PLUGIN_REGISTRY.filter((p) => p.availableInOnboarding).sort(
    (a, b) => a.order - b.order
  );
}

export function isValidCorsairPlugin(name: string): boolean {
  return PLUGIN_REGISTRY.some((p) => p.corsairPlugin === name);
}

export function getDefaultPrimaryPlugin(active: PluginId[]): PluginId | null {
  if (active.length === 0) return null;
  const sorted = [...active].sort(
    (a, b) =>
      (getPlugin(a)?.order ?? 99) - (getPlugin(b)?.order ?? 99)
  );
  return sorted[0];
}

export function getDefaultSidebarPlugin(
  active: PluginId[],
  primary: PluginId
): PluginId | null {
  if (active.length < 2) return null;
  return active.find((id) => id !== primary) ?? null;
}
