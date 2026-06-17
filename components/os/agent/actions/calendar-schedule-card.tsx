'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentAction } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { Calendar, Check, UserPlus } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 220, damping: 26 };

const PHASE_ORDER = [
  'opening',
  'select_date',
  'select_time',
  'fill_title',
  'add_attendees',
  'saving',
  'saved',
] as const;

type CalPhase = (typeof PHASE_ORDER)[number];

const PHASE_LABELS: Record<CalPhase | 'preview', string> = {
  opening: 'Opening calendar…',
  select_date: 'Selecting date…',
  select_time: 'Choosing time slot…',
  fill_title: 'Adding event title…',
  add_attendees: 'Inviting attendees…',
  saving: 'Saving to Google Calendar…',
  saved: 'Event confirmed',
  preview: 'Review event',
};

function parseDateParts(dateStr?: string) {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

function formatTime12(time?: string) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const mer = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${mer}`;
}

export function CalendarScheduleCard({ action }: { action: AgentAction }) {
  const date = action.payload?.date;
  const parts = parseDateParts(date);
  const isPreview =
    action.payload?.phase === 'preview' || action.payload?.phase === 'awaiting_review';
  const [phase, setPhase] = useState<CalPhase>('opening');

  const isRunning = action.status === 'running' && !isPreview;
  const isDone = action.status === 'done' && !isPreview;

  useEffect(() => {
    if (isPreview) {
      setPhase('add_attendees');
      return;
    }

    if (!isRunning) {
      setPhase(isDone ? 'saved' : 'opening');
      return;
    }

    let idx = 0;
    setPhase(PHASE_ORDER[0]);
    const interval = setInterval(() => {
      idx += 1;
      if (idx < PHASE_ORDER.length - 1) {
        setPhase(PHASE_ORDER[idx]);
      } else {
        clearInterval(interval);
      }
    }, 900);
    return () => clearInterval(interval);
  }, [isRunning, isDone, action.id, isPreview]);

  useEffect(() => {
    if (action.payload?.phase === 'saved' || (isDone && !isPreview)) setPhase('saved');
  }, [action.payload?.phase, isDone, isPreview]);

  const miniDays = useMemo(() => {
    if (!parts) return [];
    const first = new Date(parts.year, parts.month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(parts.year, parts.month + 1, 0).getDate();
    const cells: Array<{ day: number | null; active: boolean }> = [];
    for (let i = 0; i < startPad; i++) cells.push({ day: null, active: false });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, active: d === parts.day });
    }
    return cells;
  }, [parts]);

  const monthLabel = parts
    ? new Date(parts.year, parts.month, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    : 'Calendar';

  const phaseIdx = isPreview ? PHASE_ORDER.length - 2 : PHASE_ORDER.indexOf(phase);
  const showDate = isPreview || phaseIdx >= 1;
  const showTime = isPreview || phaseIdx >= 2;
  const showTitle = isPreview || phaseIdx >= 3;
  const showAttendees = isPreview || phaseIdx >= 4;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="space-y-3 rounded-xl border border-border-subtle bg-bg-elevated p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-text-muted" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {isPreview ? 'Calendar event preview' : 'Scheduling event'}
        </span>
        <motion.span
          key={isPreview ? 'preview' : phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ml-1 text-[11px] text-text-muted"
        >
          · {isPreview ? PHASE_LABELS.preview : PHASE_LABELS[phase]}
        </motion.span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <div className="space-y-3">
          {/* Mini calendar */}
          <div className="rounded-lg bg-bg-surface p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              {monthLabel}
            </p>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-text-muted">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {miniDays.map((cell, i) => (
                <div
                  key={i}
                  className={cn(
                    'relative flex h-6 items-center justify-center rounded text-[10px]',
                    !cell.day && 'opacity-0',
                    cell.active ? 'font-semibold text-text-inverse' : 'text-text-muted'
                  )}
                >
                  {/* Animated highlight for active day */}
                  {cell.active && showDate && (
                    <motion.span
                      className="absolute inset-0 rounded bg-accent-blue"
                      initial={isPreview ? { scale: 1 } : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={
                        isPreview
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 280, damping: 22, delay: 0.4 }
                      }
                    />
                  )}
                  <span className="relative z-10">{cell.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Time slot — slides in */}
          {showTime && (
            <motion.div
              initial={{ opacity: 0, x: -16, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              className="rounded-lg bg-bg-surface px-3 py-2"
            >
              <p className="text-[10px] uppercase tracking-wide text-text-muted">Time</p>
              <p className="text-[14px] font-semibold text-text-primary">
                {formatTime12(action.payload?.startTime)}
                {action.payload?.endTime ? ` – ${formatTime12(action.payload?.endTime)}` : ''}
              </p>
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          {/* Title */}
          {showTitle && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.1 }}
              className="rounded-lg bg-bg-surface p-2.5"
            >
              <p className="text-[10px] uppercase text-text-muted">Title</p>
              <p className="line-clamp-2 text-[12px] font-medium text-text-primary">
                {action.payload?.summary || 'New event'}
              </p>
            </motion.div>
          )}

          {/* Attendees */}
          {showAttendees && (action.payload?.attendees?.length ?? 0) > 0 && (
            <div className="space-y-1">
              {action.payload!.attendees!.map((email, i) => (
                <motion.div
                  key={email}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.15 + i * 0.05 }}
                  className="flex items-center gap-1.5 rounded-md bg-accent-blue/10 px-2 py-1 text-[10px] text-text-secondary"
                >
                  <UserPlus className="h-3 w-3 text-accent-blue" />
                  <span className="truncate">{email}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Saved — not shown during preview */}
          {phase === 'saved' && !isPreview && (
            <motion.div
              initial={{ scale: 0, rotate: -45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex items-center gap-1.5 text-[11px] font-medium text-accent-blue"
            >
              <Check className="h-3.5 w-3.5" />
              Saved
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
