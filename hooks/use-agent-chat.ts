'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store/app-store';
import { useAgentContext } from '@/hooks/use-agent-context';
import { AGENT_THREADS_KEY } from '@/hooks/use-agent-threads';
import type { AgentStreamEvent } from '@/lib/agent/stream-events';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useAgentChat() {
  const context = useAgentContext();
  const queryClient = useQueryClient();
  const {
    addAgentMessage,
    setAgentSteps,
    setAgentActions,
    addAgentAction,
    updateAgentAction,
    updateAgentStep,
    setAgentExecuting,
    updateAgentMessage,
    appendAgentMessageContent,
    setAgentThreadId,
    isAgentExecuting,
    agentThreadId,
  } = useAppStore();

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || useAppStore.getState().isAgentExecuting) return;

      const userMsg = { id: makeId(), role: 'user' as const, content: trimmed };
      addAgentMessage(userMsg);
      setAgentExecuting(true);
      setAgentSteps([]);
      setAgentActions([]);

      let assistantId: string | null = null;

      try {
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            threadId: agentThreadId,
            context,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error ?? 'Request failed');
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as AgentStreamEvent;
            handleStreamEvent(event);
          }
        }

        if (buffer.trim()) {
          const event = JSON.parse(buffer) as AgentStreamEvent;
          handleStreamEvent(event);
        }

        queryClient.invalidateQueries({ queryKey: AGENT_THREADS_KEY });
      } catch (e) {
        setAgentSteps([]);
        setAgentActions([]);
        addAgentMessage({
          id: makeId(),
          role: 'assistant',
          content:
            e instanceof Error
              ? `Something went wrong: ${e.message}`
              : 'Something went wrong. Please try again.',
        });
      } finally {
        if (assistantId) {
          updateAgentMessage(assistantId, { isStreaming: false });
        }
        setAgentExecuting(false);
      }

      function handleStreamEvent(event: AgentStreamEvent) {
        switch (event.type) {
          case 'thread':
            setAgentThreadId(event.threadId);
            break;
          case 'step': {
            const steps = useAppStore.getState().agentSteps;
            setAgentSteps([...steps, event.step]);
            break;
          }
          case 'step-update':
            updateAgentStep(event.id, event.patch);
            break;
          case 'action':
            addAgentAction(event.action);
            break;
          case 'action-update':
            updateAgentAction(event.id, event.patch);
            break;
          case 'text-start':
            assistantId = event.messageId;
            addAgentMessage({
              id: event.messageId,
              role: 'assistant',
              content: '',
              isStreaming: true,
            });
            break;
          case 'text-delta':
            if (assistantId) {
              appendAgentMessageContent(assistantId, event.delta);
            }
            break;
          case 'text-end':
            if (assistantId) {
              updateAgentMessage(assistantId, { isStreaming: false });
            }
            break;
          case 'error':
            if (!assistantId) {
              addAgentMessage({
                id: makeId(),
                role: 'assistant',
                content: event.error,
              });
            }
            break;
          case 'done':
            break;
        }
      }
    },
    [
      addAgentMessage,
      addAgentAction,
      appendAgentMessageContent,
      agentThreadId,
      context,
      queryClient,
      setAgentActions,
      setAgentExecuting,
      setAgentSteps,
      setAgentThreadId,
      updateAgentAction,
      updateAgentMessage,
      updateAgentStep,
    ]
  );

  return { sendMessage, isAgentExecuting };
}
