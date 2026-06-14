'use client';

import { useEffect, useMemo } from 'react';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { getLayoutModes } from '@/lib/plugins/layout';

/** Layout state for the active workspace (max 2 plugins). */
export function useWorkspaceLayout() {
  const {
    activePlugins,
    layout,
    activeWorkspace,
    isLoading,
    focusPlugin,
    updateWorkspaceLayout,
    connectedPlugins,
  } = useWorkspaces();

  const layoutModes = useMemo(
    () => getLayoutModes(activePlugins),
    [activePlugins]
  );

  const setLayout = async (
    nextPrimary: string,
    nextSidebar?: string | null
  ) => {
    if (!activeWorkspace) return;
    await updateWorkspaceLayout(
      activeWorkspace.id,
      nextPrimary,
      nextSidebar ?? null
    );
  };

  return {
    activePlugins,
    connectedPlugins,
    primary: layout.primary,
    sidebar: activePlugins.length > 1 ? layout.sidebar : null,
    hasSecondary: activePlugins.length > 1 && layout.sidebar !== null,
    layoutModes,
    activeWorkspace,
    isLoading,
    setLayout,
    focusPlugin,
  };
}
