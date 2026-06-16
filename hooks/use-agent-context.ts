'use client';

import { useAppStore, type WorkspaceMode } from '@/lib/store/app-store';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export type AgentContext = {
  userName: string;
  folder: string;
  workspaceMode: WorkspaceMode;
  calendarView: string;
  currentDate: string;
  timeZone: string;
  nowLocal: string;
  todayDate: string;
  selectedEmail: { id: string; subject: string } | null;
  contextLabel: string;
};

function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

function getTodayInTimezone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function formatNowInTimezone(timeZone: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(new Date());
}

export function useAgentContext(): AgentContext {
  const {
    selectedEmailId,
    emailCategory,
    workspaceMode,
    calendarView,
    currentDateStr,
  } = useAppStore();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const timeZone = useMemo(() => getBrowserTimeZone(), []);
  const todayDate = getTodayInTimezone(timeZone);
  const nowLocal = formatNowInTimezone(timeZone);

  const threadData = queryClient.getQueryData(['email-thread', selectedEmailId]) as
    | { subject?: string }[]
    | undefined;
  const selectedSubject = threadData?.[0]?.subject;

  const userName = session?.user?.name?.split(' ')[0] ?? 'there';

  let contextLabel = `Folder: ${emailCategory}`;
  if (selectedEmailId) {
    contextLabel = `Email: ${selectedSubject ?? 'Loading...'}`;
  } else if (workspaceMode === 'calendar') {
    contextLabel = `Calendar · ${calendarView}`;
  } else if (workspaceMode === 'github') {
    contextLabel = 'GitHub';
  }

  return {
    userName,
    folder: emailCategory,
    workspaceMode,
    calendarView,
    currentDate: currentDateStr,
    timeZone,
    nowLocal,
    todayDate,
    selectedEmail: selectedEmailId
      ? { id: selectedEmailId, subject: selectedSubject ?? 'Loading...' }
      : null,
    contextLabel,
  };
}
