'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AgentServiceIcon } from './agent-service-icon';
import { Send, Sparkles, Video } from 'lucide-react';
import { useAppStore, type AgentCalendarIntent } from '@/lib/store/app-store';
import { useAgentChat } from '@/hooks/use-agent-chat';
import { useAiCreditsGate } from '@/hooks/use-ai-credits-gate';
import { useAgentContext } from '@/hooks/use-agent-context';
import { CalendarScheduleCard } from './actions/calendar-schedule-card';
import { cn } from '@/lib/utils';

const spring = { type: 'spring' as const, stiffness: 220, damping: 26 };

const REPHRASE_SUGGESTIONS = [
  'Make it more formal',
  'Make it shorter',
  'Make it friendlier',
  'Add more detail',
];

function patchCalendar(
  current: AgentCalendarIntent | undefined,
  patch: Partial<AgentCalendarIntent>,
  fallback: AgentCalendarIntent
): AgentCalendarIntent {
  return { ...fallback, ...current, ...patch };
}

export function EmailReviewPanel() {
  const { agentPendingReview, updateAgentPendingReview, isAgentExecuting } = useAppStore();
  const { todayDate, timeZone } = useAgentContext();
  const { confirmEmailDraft, sendMessage } = useAgentChat();
  const { agentActionBlocked } = useAiCreditsGate();
  const [sending, setSending] = useState(false);

  const defaultCalendar = useMemo<AgentCalendarIntent>(
    () => ({
      summary: agentPendingReview?.subject || 'Meeting',
      date: todayDate,
      startTime: '18:00',
      endTime: '19:00',
      attendees: agentPendingReview?.to ?? [],
      addGoogleMeet: true,
      timeZone,
    }),
    [agentPendingReview?.subject, agentPendingReview?.to, todayDate, timeZone]
  );

  if (!agentPendingReview) return null;

  const { to, subject, body, calendarIntent, groupId } = agentPendingReview;
  const toValue = to.join(', ');
  const hasCalendar = !!calendarIntent;
  const cal = calendarIntent ?? defaultCalendar;

  const calendarPreviewAction = {
    id: `preview-cal-${groupId}`,
    type: 'calendar_schedule' as const,
    status: 'done' as const,
    title: 'Event preview',
    groupId,
    payload: {
      phase: 'awaiting_review',
      date: cal.date,
      startTime: cal.startTime,
      endTime: cal.endTime,
      summary: cal.summary,
      attendees: cal.attendees ?? to,
      timeZone: cal.timeZone ?? timeZone,
    },
  };

  const updateCal = (patch: Partial<AgentCalendarIntent>) => {
    updateAgentPendingReview({
      calendarIntent: patchCalendar(calendarIntent, patch, defaultCalendar),
    });
  };

  const handleSend = async () => {
    if (sending || isAgentExecuting || agentActionBlocked) return;
    setSending(true);
    try {
      await confirmEmailDraft({
        to: agentPendingReview.to,
        subject: agentPendingReview.subject,
        body: agentPendingReview.body,
        calendarIntent: hasCalendar ? (agentPendingReview.calendarIntent ?? defaultCalendar) : undefined,
      });
    } finally {
      setSending(false);
    }
  };

  const handleRephrase = (instruction: string) => {
    sendMessage(
      `Please rephrase the email draft: ${instruction}. Keep the same recipient and intent.`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="flex gap-3"
    >
      <div className="w-7 shrink-0" />
      <div className="min-w-0 flex-1 space-y-4">
        {/* Email section */}
        <div className="space-y-3 rounded-xl border border-border-default bg-bg-elevated p-4 shadow-md">
          <div className="flex items-center gap-2">
            <AgentServiceIcon service="email" size={16} />
            <span className="text-[12px] font-semibold uppercase tracking-wider text-text-muted">
              Review your email
            </span>
          </div>

          <p className="text-[13px] text-text-secondary">
            Edit the draft below, or ask me to rephrase it. When you&apos;re ready, send the email
            {hasCalendar ? ' and create the calendar event' : ''}.
          </p>

          <div className="space-y-2.5">
            <label className="block space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">To</span>
              <input
                type="text"
                value={toValue}
                onChange={(e) =>
                  updateAgentPendingReview({
                    to: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Subject
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => updateAgentPendingReview({ subject: e.target.value })}
                className="w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Message
              </span>
              <textarea
                rows={6}
                value={body}
                onChange={(e) => updateAgentPendingReview({ body: e.target.value })}
                className="w-full resize-y rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-[13px] leading-relaxed text-text-primary outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/20"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {REPHRASE_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isAgentExecuting}
                onClick={() => handleRephrase(suggestion)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border border-border-subtle bg-bg-surface px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-colors',
                  'hover:border-border-default hover:text-text-primary disabled:opacity-40'
                )}
              >
                <Sparkles className="h-3 w-3" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar section */}
        {hasCalendar && (
          <div className="space-y-3">
            <CalendarScheduleCard action={calendarPreviewAction} />

            <div className="rounded-xl border border-border-default bg-bg-elevated p-4 shadow-md">
              <div className="mb-3 flex items-center gap-2">
                <AgentServiceIcon service="calendar" size={16} />
                <span className="text-[12px] font-semibold uppercase tracking-wider text-text-muted">
                  Edit event details
                </span>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                <label className="block space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    Event title
                  </span>
                  <input
                    type="text"
                    value={cal.summary}
                    onChange={(e) => updateCal({ summary: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent-blue/50"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    Date
                  </span>
                  <input
                    type="date"
                    value={cal.date}
                    onChange={(e) => updateCal({ date: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent-blue/50"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    Start time
                  </span>
                  <input
                    type="time"
                    value={cal.startTime}
                    onChange={(e) => updateCal({ startTime: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent-blue/50"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    End time
                  </span>
                  <input
                    type="time"
                    value={cal.endTime}
                    onChange={(e) => updateCal({ endTime: e.target.value })}
                    className="w-full rounded-lg border border-border-subtle bg-bg-surface px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent-blue/50"
                  />
                </label>

                <label className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={cal.addGoogleMeet !== false}
                    onChange={(e) => updateCal({ addGoogleMeet: e.target.checked })}
                    className="rounded border-border-subtle"
                  />
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
                    <Video className="h-3.5 w-3.5 text-accent-blue" />
                    Add Google Meet link to event and email
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {agentActionBlocked && (
            <p className="mr-auto text-xs text-amber-600">
              Not enough credits to send or schedule. Add credits in billing.
            </p>
          )}
          <button
            type="button"
            disabled={
              sending || isAgentExecuting || agentActionBlocked || !subject.trim() || !body.trim()
            }
            onClick={handleSend}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all',
              'bg-accent-blue text-text-inverse hover:bg-accent-blue-dim',
              'disabled:opacity-40'
            )}
          >
            <Send className="h-3.5 w-3.5" />
            {hasCalendar ? 'Send & Schedule' : 'Send Email'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
