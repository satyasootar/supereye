'use client';

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store/app-store';
import type { AgentThreadSummary } from '@/lib/agent/threads';

export const AGENT_THREADS_KEY = ['agent', 'threads'] as const;

type ThreadsResponse = { threads: AgentThreadSummary[] };

type ThreadDetailResponse = {
  thread: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string;
  };
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
  }>;
};

export function useAgentThreads() {
  const queryClient = useQueryClient();
  const {
    agentThreadId,
    setAgentThreadId,
    setAgentMessages,
    setAgentSteps,
    setAgentActions,
    startNewAgentThread,
    isAgentExecuting,
  } = useAppStore();

  const threadsQuery = useQuery({
    queryKey: AGENT_THREADS_KEY,
    queryFn: async (): Promise<AgentThreadSummary[]> => {
      const res = await fetch('/api/agent/threads');
      if (!res.ok) throw new Error('Failed to load threads');
      const data = (await res.json()) as ThreadsResponse;
      return data.threads;
    },
    staleTime: 30_000,
  });

  const loadThread = useCallback(
    async (threadId: string) => {
      if (isAgentExecuting) return;

      const res = await fetch(`/api/agent/threads/${threadId}`);
      if (!res.ok) throw new Error('Failed to load thread');

      const data = (await res.json()) as ThreadDetailResponse;
      setAgentThreadId(data.thread.id);
      setAgentMessages(
        data.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
      );
      setAgentSteps([]);
      setAgentActions([]);
    },
    [
      isAgentExecuting,
      setAgentActions,
      setAgentMessages,
      setAgentSteps,
      setAgentThreadId,
    ]
  );

  const createThreadMutation = useMutation({
    mutationFn: async (title?: string) => {
      const res = await fetch('/api/agent/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to create thread');
      return res.json() as Promise<{ thread: AgentThreadSummary }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_THREADS_KEY });
    },
  });

  const renameThreadMutation = useMutation({
    mutationFn: async ({ threadId, title }: { threadId: string; title: string }) => {
      const res = await fetch(`/api/agent/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to rename thread');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENT_THREADS_KEY });
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const res = await fetch(`/api/agent/threads/${threadId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete thread');
      return res.json();
    },
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: AGENT_THREADS_KEY });
      if (agentThreadId === deletedId) {
        startNewAgentThread();
      }
    },
  });

  const startNewChat = useCallback(() => {
    if (isAgentExecuting) return;
    startNewAgentThread();
  }, [isAgentExecuting, startNewAgentThread]);

  const refreshThreads = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: AGENT_THREADS_KEY });
  }, [queryClient]);

  return {
    threads: threadsQuery.data ?? [],
    isLoadingThreads: threadsQuery.isLoading,
    agentThreadId,
    loadThread,
    startNewChat,
    createThread: createThreadMutation.mutateAsync,
    renameThread: renameThreadMutation.mutateAsync,
    deleteThread: deleteThreadMutation.mutateAsync,
    refreshThreads,
    isDeleting: deleteThreadMutation.isPending,
    isRenaming: renameThreadMutation.isPending,
  };
}
