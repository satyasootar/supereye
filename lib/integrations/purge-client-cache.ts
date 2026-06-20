'use client';

import type { QueryClient } from '@tanstack/react-query';
import { useDataCacheStore } from '@/lib/store/data-cache-store';
import { useAppStore } from '@/lib/store/app-store';
import {
  getPluginDisconnectCleanup,
  type CorsairPlugin,
} from '@/lib/integrations/disconnect-cleanup';
import { getPluginByCorsairName } from '@/lib/plugins/registry';
import type { PluginId } from '@/lib/plugins/types';

function resetPluginUiState(pluginId: PluginId) {
  if (pluginId === 'github') {
    useAppStore.setState({
      githubSection: 'overview',
      githubView: 'pulls',
      githubRepoTab: 'pulls',
      githubInboxFilter: 'all',
      selectedGithubRepo: null,
      selectedGithubItemKey: null,
    });
  }

  if (pluginId === 'drive') {
    useAppStore.setState({
      driveSection: 'recent',
      selectedDriveFolderId: null,
      selectedDriveFileId: null,
    });
  }
}

/** Drop client-side integration data after disconnect (React Query + Zustand + UI selection). */
export function purgeIntegrationClientCache(
  queryClient: QueryClient,
  corsairPlugin: CorsairPlugin
) {
  const cleanup = getPluginDisconnectCleanup(corsairPlugin);
  const plugin = getPluginByCorsairName(corsairPlugin);

  for (const queryKey of cleanup.queryKeys) {
    queryClient.removeQueries({ queryKey, exact: false });
  }

  const store = useDataCacheStore.getState();
  for (const namespace of cleanup.cacheNamespaces) {
    store.removeNamespace(namespace);
  }

  if (plugin) {
    resetPluginUiState(plugin.id);
  }
}
