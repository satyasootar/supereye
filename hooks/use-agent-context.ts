'use client';

import { useAppStore } from '@/lib/store/app-store';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export type AgentContext = {
  userName: string;
  folder: string;
  workspaceMode: 'email' | 'calendar';
  calendarView: string;
  currentDate: string;
  selectedEmail: { id: string; subject: string } | null;
  contextLabel: string;
};

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
  }

  return {
    userName,
    folder: emailCategory,
    workspaceMode,
    calendarView,
    currentDate: currentDateStr,
    selectedEmail: selectedEmailId
      ? { id: selectedEmailId, subject: selectedSubject ?? 'Loading...' }
      : null,
    contextLabel,
  };
}
