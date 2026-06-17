'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AppTour } from '@/components/tour/app-tour';
import { useTourStore } from '@/lib/store/tour-store';
import { DEFAULT_BOT_SETTINGS, type BotSettings } from '@/lib/plugins/types';
import { USER_PREFERENCES_KEY } from '@/hooks/use-workspaces';
import { useWorkspaceLayout } from '@/hooks/use-workspace-layout';

type PreferencesResponse = {
  botSettings?: BotSettings;
  onboardingCompleted?: boolean;
};

function AppTourProviderInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const startTour = useTourStore((s) => s.startTour);
  const isActive = useTourStore((s) => s.isActive);
  const { isLoading: layoutLoading } = useWorkspaceLayout();
  const autoStarted = useRef(false);

  const { data: prefs, isLoading: prefsLoading } = useQuery<PreferencesResponse>({
    queryKey: USER_PREFERENCES_KEY,
    queryFn: async () => {
      const res = await fetch('/api/user/preferences');
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 60_000,
  });

  const tourCompleted =
    prefs?.botSettings?.workspaceTourCompleted ??
    DEFAULT_BOT_SETTINGS.workspaceTourCompleted ??
    false;

  useEffect(() => {
    if (pathname !== '/workspace') return;

    const tourParam = searchParams.get('tour');
    const forceStart = tourParam === '1' || tourParam === 'start' || tourParam === 'force';
    if (!forceStart && (autoStarted.current || isActive || prefsLoading || layoutLoading)) {
      return;
    }
    if (!forceStart && tourCompleted) return;
    if (!forceStart && autoStarted.current) return;
    if (isActive) return;
    if (prefsLoading || layoutLoading) return;

    const timer = window.setTimeout(() => {
      autoStarted.current = true;
      startTour();

      if (forceStart) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('tour');
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      }
    }, forceStart ? 200 : 600);

    return () => window.clearTimeout(timer);
  }, [
    isActive,
    layoutLoading,
    pathname,
    prefsLoading,
    router,
    searchParams,
    startTour,
    tourCompleted,
  ]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as Window & { __startSupereyeTour?: () => void }).__startSupereyeTour =
        () => useTourStore.getState().startTour();
    }
  }, []);

  return (
    <>
      {children}
      <AppTour />
    </>
  );
}

export function AppTourProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <AppTourProviderInner>{children}</AppTourProviderInner>
    </Suspense>
  );
}
