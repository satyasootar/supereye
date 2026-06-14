'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { useAgentContext } from '@/hooks/use-agent-context';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useAgentChat() {
  const context = useAgentContext();
  const {
    agentMessages,
    addAgentMessage,
    setAgentSteps,
    setAgentExecuting,
    isAgentExecuting,
  } = useAppStore();

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || useAppStore.getState().isAgentExecuting) return;

      const userMsg = { id: makeId(), role: 'user' as const, content: trimmed };
      const priorMessages = useAppStore.getState().agentMessages;
      addAgentMessage(userMsg);
      setAgentExecuting(true);
      setAgentSteps([
        { id: 'start', label: 'Understanding request...', status: 'running' },
      ]);

      try {
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...priorMessages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error ?? 'Request failed');
        }

        const data = await res.json();

        if (data.steps?.length) {
          setAgentSteps(data.steps);
        } else {
          setAgentSteps([]);
        }

        addAgentMessage({
          id: makeId(),
          role: 'assistant',
          content: data.text || 'I could not generate a response.',
        });
      } catch (e) {
        setAgentSteps([]);
        addAgentMessage({
          id: makeId(),
          role: 'assistant',
          content:
            e instanceof Error
              ? `Something went wrong: ${e.message}`
              : 'Something went wrong. Please try again.',
        });
      } finally {
        setAgentExecuting(false);
      }
    },
    [
      addAgentMessage,
      context,
      setAgentExecuting,
      setAgentSteps,
    ]
  );

  return { sendMessage, isAgentExecuting };
}
