'use client';

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store/app-store';
import { resolveWorkspaceLayout } from '@/lib/plugins/layout';
import type { PluginId, WorkspaceRecord } from '@/lib/plugins/types';
import { ACTIVE_PLUGINS_KEY } from '@/hooks/use-active-plugins';

export const WORKSPACES_KEY = ['workspaces'] as const;
export const USER_PREFERENCES_KEY = ['user', 'preferences'] as const;

export type WorkspaceContextResponse = {
  workspaces: WorkspaceRecord[];
  activeWorkspace: WorkspaceRecord | null;
  activeWorkspaceId: string | null;
  connectedPlugins: PluginId[];
  activePlugins: PluginId[];
  layout: { primary: PluginId; sidebar: PluginId | null };
  onboardingCompleted?: boolean;
};

export function useWorkspaces() {
  const queryClient = useQueryClient();
  const {
    activeWorkspaceId,
    setActiveWorkspaceId,
    applyWorkspaceLayout,
  } = useAppStore();

  const query = useQuery({
    queryKey: WORKSPACES_KEY,
    queryFn: async (): Promise<WorkspaceContextResponse> => {
      const res = await fetch('/api/workspaces');
      if (!res.ok) throw new Error('Failed to load workspaces');
      return res.json();
    },
    staleTime: 30_000,
  });

  const data = query.data;
  const workspaces = data?.workspaces ?? [];
  const activeWorkspace =
    workspaces.find((w) => w.id === (activeWorkspaceId ?? data?.activeWorkspaceId)) ??
    data?.activeWorkspace ??
    workspaces[0] ??
    null;

  const activePlugins = data?.activePlugins ?? [];
  const connectedPlugins = data?.connectedPlugins ?? [];
  const layout = useMemo(() => {
    const serverLayout = data?.layout ?? {
      primary: activeWorkspace?.primaryPluginId ?? 'email',
      sidebar: activeWorkspace?.sidebarPluginId ?? null,
    };
    return resolveWorkspaceLayout(activePlugins, {
      primaryPluginId: serverLayout.primary,
      sidebarPluginId: serverLayout.sidebar,
    });
  }, [data?.layout, activePlugins, activeWorkspace?.primaryPluginId, activeWorkspace?.sidebarPluginId]);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      const target = workspaces.find((w) => w.id === workspaceId);
      if (!target) return;

      const workspacePlugins = target.pluginIds.filter((id) =>
        activePlugins.includes(id)
      );

      setActiveWorkspaceId(workspaceId);
      applyWorkspaceLayout(
        {
          primary: target.primaryPluginId,
          sidebar: target.sidebarPluginId,
        },
        workspacePlugins.length > 0 ? workspacePlugins : activePlugins
      );

      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeWorkspaceId: workspaceId }),
      });

      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: USER_PREFERENCES_KEY });
    },
    [workspaces, activePlugins, setActiveWorkspaceId, applyWorkspaceLayout, queryClient]
  );

  const updateWorkspaceMutation = useMutation({
    mutationFn: async ({
      workspaceId,
      primary,
      sidebar,
    }: {
      workspaceId: string;
      primary: PluginId;
      sidebar: PluginId | null;
    }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryPluginId: primary, sidebarPluginId: sidebar }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to update workspace');
      }
      return res.json() as Promise<WorkspaceContextResponse>;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(WORKSPACES_KEY, result);
      if (result.activeWorkspaceId) {
        setActiveWorkspaceId(result.activeWorkspaceId);
        applyWorkspaceLayout(result.layout, result.activePlugins);
      }
    },
  });

  const updateWorkspaceLayout = useCallback(
    async (
      workspaceId: string,
      primary: PluginId,
      sidebar: PluginId | null
    ) => {
      const resolved = resolveWorkspaceLayout(activePlugins, {
        primaryPluginId: primary,
        sidebarPluginId: sidebar,
      });
      const result = await updateWorkspaceMutation.mutateAsync({
        workspaceId,
        primary: resolved.primary,
        sidebar: resolved.sidebar,
      });
      if (workspaceId === activeWorkspace?.id) {
        applyWorkspaceLayout(result.layout, result.activePlugins);
      }
    },
    [activeWorkspace?.id, activePlugins, applyWorkspaceLayout, updateWorkspaceMutation]
  );

  const createWorkspaceMutation = useMutation({
    mutationFn: async (input: {
      name?: string;
      primaryPluginId: PluginId;
      sidebarPluginId?: PluginId | null;
    }) => {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to create workspace');
      }
      return res.json() as Promise<WorkspaceContextResponse>;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(WORKSPACES_KEY, result);
      if (result.activeWorkspaceId) {
        setActiveWorkspaceId(result.activeWorkspaceId);
        applyWorkspaceLayout(result.layout, result.activePlugins);
      }
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (workspaceId: string) => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to delete workspace');
      }
      return res.json() as Promise<WorkspaceContextResponse>;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(WORKSPACES_KEY, result);
      if (result.activeWorkspaceId) {
        setActiveWorkspaceId(result.activeWorkspaceId);
        applyWorkspaceLayout(result.layout, result.activePlugins);
      }
    },
  });

  const focusPlugin = useCallback(
    (pluginId: PluginId) => {
      if (!activeWorkspace || !activePlugins.includes(pluginId)) return;
      const other =
        activeWorkspace.pluginIds.find(
          (id) => id !== pluginId && activePlugins.includes(id)
        ) ?? null;
      const resolved = resolveWorkspaceLayout(activePlugins, {
        primaryPluginId: pluginId,
        sidebarPluginId: other,
      });
      updateWorkspaceLayout(
        activeWorkspace.id,
        resolved.primary,
        resolved.sidebar
      );
    },
    [activeWorkspace, activePlugins, updateWorkspaceLayout]
  );

  return {
    workspaces,
    activeWorkspace,
    activeWorkspaceId: activeWorkspace?.id ?? null,
    activePlugins,
    connectedPlugins,
    layout,
    isLoading: query.isLoading,
    switchWorkspace,
    focusPlugin,
    updateWorkspaceLayout,
    createWorkspace: createWorkspaceMutation.mutateAsync,
    deleteWorkspace: deleteWorkspaceMutation.mutateAsync,
    isCreating: createWorkspaceMutation.isPending,
    isUpdating: updateWorkspaceMutation.isPending,
    isDeleting: deleteWorkspaceMutation.isPending,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      queryClient.invalidateQueries({ queryKey: ACTIVE_PLUGINS_KEY });
    },
  };
}
