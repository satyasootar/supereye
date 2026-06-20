'use client';

import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore, type AgentPendingEmailReview, type AgentCalendarIntent } from '@/lib/store/app-store';
import { useAgentContext } from '@/hooks/use-agent-context';
import { inferCalendarIntentFromDraft } from '@/lib/agent/infer-calendar-intent';
import { AGENT_THREADS_KEY } from '@/hooks/use-agent-threads';
import { invalidateBillingWallet } from '@/hooks/use-billing-wallet';
import type { AgentStreamEvent } from '@/lib/agent/stream-events';

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toReviewFromAction(
  action: {
    id: string;
    groupId?: string;
    payload?: {
      to?: string | string[];
      subject?: string;
      body?: string;
      calendarIntent?: AgentCalendarIntent;
      phase?: string;
    };
  },
  timeZone?: string
): AgentPendingEmailReview | null {
  if (action.payload?.phase !== 'awaiting_review') return null;
  const toRaw = action.payload.to;
  const to = Array.isArray(toRaw) ? toRaw : toRaw ? [toRaw] : [];
  if (!to.length || !action.payload.subject || !action.payload.body || !action.groupId) return null;

  const calendarIntent = inferCalendarIntentFromDraft(
    {
      subject: action.payload.subject,
      body: action.payload.body,
      to,
      calendarIntent: action.payload.calendarIntent,
    },
    timeZone
  );

  return {
    actionId: action.id,
    groupId: action.groupId,
    to,
    subject: action.payload.subject,
    body: action.payload.body,
    calendarIntent,
  };
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
    setAgentPendingReview,
    isAgentExecuting,
    agentThreadId,
  } = useAppStore();
  const confirmInFlightRef = useRef(false);

  const syncPendingReview = useCallback(
    (actions: ReturnType<typeof useAppStore.getState>['agentActions']) => {
      const awaiting = [...actions]
        .reverse()
        .find((a) => a.type === 'email_draft' && a.payload?.phase === 'awaiting_review');
      if (awaiting) {
        const review = toReviewFromAction(awaiting, context.timeZone);
        if (review) setAgentPendingReview(review);
      }
    },
    [context.timeZone, setAgentPendingReview]
  );

  const processStream = useCallback(
    async (res: Response) => {
      let assistantId: string | null = null;

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      const handleStreamEvent = (event: AgentStreamEvent) => {
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
            if (event.action.payload?.phase === 'awaiting_review') {
              const review = toReviewFromAction(event.action, context.timeZone);
              if (review) setAgentPendingReview(review);
            }
            break;
          case 'action-update':
            updateAgentAction(event.id, event.patch);
            syncPendingReview(useAppStore.getState().agentActions);
            if (event.patch.payload?.phase === 'sent' || event.patch.payload?.phase === 'complete') {
              setAgentPendingReview(null);
            }
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
            if (assistantId) appendAgentMessageContent(assistantId, event.delta);
            break;
          case 'text-end':
            if (assistantId) updateAgentMessage(assistantId, { isStreaming: false });
            break;
          case 'error':
            if (!assistantId) {
              addAgentMessage({ id: makeId(), role: 'assistant', content: event.error });
            }
            break;
          case 'done':
            break;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          handleStreamEvent(JSON.parse(line) as AgentStreamEvent);
        }
      }
      if (buffer.trim()) {
        handleStreamEvent(JSON.parse(buffer) as AgentStreamEvent);
      }

      return assistantId;
    },
    [
      addAgentAction,
      addAgentMessage,
      appendAgentMessageContent,
      context.timeZone,
      setAgentPendingReview,
      setAgentSteps,
      setAgentThreadId,
      syncPendingReview,
      updateAgentAction,
      updateAgentMessage,
      updateAgentStep,
    ]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || useAppStore.getState().isAgentExecuting) return;

      addAgentMessage({ id: makeId(), role: 'user', content: trimmed });
      setAgentExecuting(true);
      setAgentSteps([]);
      setAgentActions([]);
      setAgentPendingReview(null);

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
          const message =
            typeof err.error === 'string' ? err.error : err.message ?? 'Request failed';
          if (res.status === 402) {
            await invalidateBillingWallet(queryClient);
          }
          throw new Error(message);
        }

        assistantId = await processStream(res);
        await invalidateBillingWallet(queryClient);
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
        if (assistantId) updateAgentMessage(assistantId, { isStreaming: false });
        setAgentExecuting(false);
      }
    },
    [
      addAgentMessage,
      agentThreadId,
      context,
      processStream,
      queryClient,
      setAgentActions,
      setAgentExecuting,
      setAgentSteps,
      setAgentPendingReview,
      updateAgentMessage,
    ]
  );

  const confirmEmailDraft = useCallback(
    async (draft: {
      to: string[];
      subject: string;
      body: string;
      calendarIntent?: AgentCalendarIntent;
    }) => {
      if (confirmInFlightRef.current || useAppStore.getState().isAgentExecuting) return;

      confirmInFlightRef.current = true;
      setAgentPendingReview(null);
      setAgentExecuting(true);
      setAgentSteps([]);
      setAgentActions([]);

      let assistantId: string | null = null;

      try {
        const res = await fetch('/api/agent/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: draft.to,
            subject: draft.subject,
            body: draft.body,
            calendarIntent: draft.calendarIntent,
            threadId: agentThreadId,
            context,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }));
          const message =
            typeof err.error === 'string' ? err.error : err.message ?? 'Request failed';
          if (res.status === 402) {
            await invalidateBillingWallet(queryClient);
          }
          throw new Error(message);
        }

        assistantId = await processStream(res);
        await invalidateBillingWallet(queryClient);
        queryClient.invalidateQueries({ queryKey: AGENT_THREADS_KEY });
      } catch (e) {
        addAgentMessage({
          id: makeId(),
          role: 'assistant',
          content:
            e instanceof Error
              ? `Could not send: ${e.message}`
              : 'Could not send the email. Please try again.',
        });
      } finally {
        confirmInFlightRef.current = false;
        if (assistantId) updateAgentMessage(assistantId, { isStreaming: false });
        setAgentExecuting(false);
      }
    },
    [
      addAgentMessage,
      agentThreadId,
      context,
      processStream,
      queryClient,
      setAgentActions,
      setAgentExecuting,
      setAgentPendingReview,
      setAgentSteps,
      updateAgentMessage,
    ]
  );

  return { sendMessage, confirmEmailDraft, isAgentExecuting };
}
