import type { LayoutMode, PluginId, WorkspaceLayout } from '@/lib/plugins/types';
import {
  getDefaultPrimaryPlugin,
  getDefaultSidebarPlugin,
  getPlugin,
  PLUGIN_REGISTRY,
} from '@/lib/plugins/registry';

export function getLayoutModes(activePlugins: PluginId[]): LayoutMode[] {
  if (activePlugins.length === 0) return [];

  return activePlugins.map((primary) => {
    const primaryMeta = getPlugin(primary);
    const sidebar = getDefaultSidebarPlugin(activePlugins, primary);
    const sidebarMeta = sidebar ? getPlugin(sidebar) : null;

    return {
      id: sidebar ? `${primary}+${sidebar}` : primary,
      primary,
      sidebar,
      label: sidebarMeta
        ? `${primaryMeta?.shortLabel ?? primary} focus · ${sidebarMeta.shortLabel} sidebar`
        : `${primaryMeta?.shortLabel ?? primary} only`,
    };
  });
}

type LayoutPrefs = {
  primaryPluginId: PluginId | null;
  sidebarPluginId: PluginId | null;
};

export function resolveWorkspaceLayout(
  activePlugins: PluginId[],
  prefs: LayoutPrefs
): WorkspaceLayout {
  if (activePlugins.length === 0) {
    return { primary: 'email', sidebar: null };
  }

  if (activePlugins.length === 1) {
    return { primary: activePlugins[0], sidebar: null };
  }

  let primary = prefs.primaryPluginId;
  let sidebar = prefs.sidebarPluginId;

  if (!primary || !activePlugins.includes(primary)) {
    primary = getDefaultPrimaryPlugin(activePlugins)!;
  }

  if (
    !sidebar ||
    !activePlugins.includes(sidebar) ||
    sidebar === primary
  ) {
    sidebar = getDefaultSidebarPlugin(activePlugins, primary);
  }

  return { primary, sidebar };
}

export function layoutToWorkspaceMode(primary: PluginId): 'email' | 'calendar' {
  return primary === 'calendar' ? 'calendar' : 'email';
}

export function workspaceModeToLayout(
  mode: 'email' | 'calendar',
  activePlugins: PluginId[]
): WorkspaceLayout {
  const primary = mode === 'calendar' ? 'calendar' : 'email';

  if (!activePlugins.includes(primary)) {
    return resolveWorkspaceLayout(activePlugins, {
      primaryPluginId: null,
      sidebarPluginId: null,
    });
  }

  return {
    primary,
    sidebar: getDefaultSidebarPlugin(activePlugins, primary),
  };
}

export function isLayoutModeActive(
  layout: WorkspaceLayout,
  mode: LayoutMode
): boolean {
  return layout.primary === mode.primary && layout.sidebar === mode.sidebar;
}

export function getOrderedActivePlugins(activeIds: PluginId[]): PluginId[] {
  return PLUGIN_REGISTRY.filter((p) => activeIds.includes(p.id))
    .sort((a, b) => a.order - b.order)
    .map((p) => p.id);
}
