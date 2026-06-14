'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentAction } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { Calendar, Check, UserPlus } from 'lucide-react';

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
  const [phase, setPhase] = useState<CalPhase>('opening');

  const isRunning = action.status === 'running';
  const isDone = action.status === 'done';

  useEffect(() => {
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
    }, 550);
    return () => clearInterval(interval);
  }, [isRunning, isDone, action.id]);

  useEffect(() => {
    if (action.payload?.phase === 'saved' || isDone) setPhase('saved');
  }, [action.payload?.phase, isDone]);

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated/70 backdrop-blur-md"
    >
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
        <Calendar className="h-3.5 w-3.5 text-accent-blue" />
        <span className="text-[12px] font-semibold text-text-primary">Scheduling event</span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-[1fr_140px]">
        <div className="space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[12px] text-text-muted"
            >
              {phase === 'opening' && 'Opening calendar…'}
              {phase === 'select_date' && 'Selecting date…'}
              {phase === 'select_time' && 'Choosing time slot…'}
              {phase === 'fill_title' && 'Adding event title…'}
              {phase === 'add_attendees' && 'Inviting attendees…'}
              {phase === 'saving' && 'Saving to Google Calendar…'}
              {phase === 'saved' && 'Event confirmed'}
            </motion.div>
          </AnimatePresence>

          <div className="rounded-lg border border-border-subtle bg-bg-surface/40 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
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
                    'flex h-6 items-center justify-center rounded text-[10px]',
                    !cell.day && 'opacity-0',
                    cell.active
                      ? 'bg-accent-blue font-semibold text-white shadow-sm'
                      : 'text-text-muted'
                  )}
                >
                  {cell.day}
                </div>
              ))}
            </div>
          </div>

          <motion.div
            animate={{
              borderColor:
                phase === 'select_time' || phase === 'fill_title' || phase === 'saved'
                  ? 'rgba(115,255,140,0.45)'
                  : 'rgba(255,255,255,0.08)',
            }}
            className="rounded-lg border px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-wide text-text-muted">Time</p>
            <p className="text-[14px] font-semibold text-text-primary">
              {formatTime12(action.payload?.startTime)}
              {action.payload?.endTime ? ` – ${formatTime12(action.payload?.endTime)}` : ''}
            </p>
          </motion.div>
        </div>

        <div className="space-y-2">
          <motion.div
            className="rounded-lg border border-border-subtle bg-bg-surface/50 p-2.5"
            animate={{ opacity: phase === 'fill_title' || phase === 'saved' ? 1 : 0.45 }}
          >
            <p className="text-[10px] uppercase text-text-muted">Title</p>
            <p className="line-clamp-2 text-[12px] font-medium text-text-primary">
              {action.payload?.summary || 'New event'}
            </p>
          </motion.div>

          {(action.payload?.attendees?.length ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: phase === 'add_attendees' || phase === 'saving' || phase === 'saved' ? 1 : 0.3,
              }}
              className="space-y-1"
            >
              {action.payload!.attendees!.map((email) => (
                <div
                  key={email}
                  className="flex items-center gap-1.5 rounded-md bg-accent-blue/10 px-2 py-1 text-[10px] text-text-secondary"
                >
                  <UserPlus className="h-3 w-3 text-accent-blue" />
                  <span className="truncate">{email}</span>
                </div>
              ))}
            </motion.div>
          )}

          {phase === 'saved' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
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
