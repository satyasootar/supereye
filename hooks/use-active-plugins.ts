'use client';

import { useQuery } from '@tanstack/react-query';

export const ACTIVE_PLUGINS_KEY = ['integrations', 'status'] as const;

type IntegrationsStatusResponse = {
  plugins: Array<{
    id: string;
    label: string;
    connected: boolean;
    connectedAt: string | null;
  }>;
  activePlugins: string[];
};

export function useActivePlugins() {
  const query = useQuery({
    queryKey: ACTIVE_PLUGINS_KEY,
    queryFn: async (): Promise<IntegrationsStatusResponse> => {
      const res = await fetch('/api/integrations/status');
      if (!res.ok) throw new Error('Failed to load integrations');
      return res.json();
    },
    staleTime: 30_000,
  });

  return {
    plugins: query.data?.plugins ?? [],
    activePlugins: query.data?.activePlugins ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
