/**
 * Workspace plugin types.
 * Add new plugins by extending PLUGIN_IDS in registry.ts.
 */
export type PluginId = string;

export type PluginDefinition = {
  /** Workspace-facing identifier (e.g. 'email', 'calendar', 'github') */
  id: PluginId;
  /** Corsair SDK plugin name used for OAuth connect */
  corsairPlugin: string;
  label: string;
  shortLabel: string;
  description: string;
  /** Match integration names from corsair_integrations table */
  matchers: string[];
  /** Show in onboarding connect step */
  availableInOnboarding: boolean;
  /** Shown in onboarding but not connectable yet */
  comingSoon?: boolean;
  /** Default sort order in workspace (lower = first) */
  order: number;
};

export type LayoutMode = {
  id: string;
  primary: PluginId;
  sidebar: PluginId | null;
  label: string;
};

export type WorkspaceLayout = {
  primary: PluginId;
  sidebar: PluginId | null;
};

export type UserWorkspacePreferences = {
  onboardingCompleted: boolean;
  activeWorkspaceId: string | null;
};

export type WorkspaceRecord = {
  id: string;
  name: string;
  primaryPluginId: PluginId;
  sidebarPluginId: PluginId | null;
  pluginIds: PluginId[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ActivePluginStatus = {
  id: PluginId;
  label: string;
  connected: boolean;
  connectedAt: string | null;
};
