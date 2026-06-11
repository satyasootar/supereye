'use client';

import { SchedulePanel } from './schedule-panel';
import { InboxPanel } from './inbox-panel';
import { Mail, Calendar } from 'lucide-react';
import { useSSE } from '@/hooks/use-sse';
import { useEffect, useState } from 'react';

interface DailyBriefProps {
  isGmailConnected: boolean;
  isCalendarConnected: boolean;
}

export function DailyBrief({ isGmailConnected, isCalendarConnected }: DailyBriefProps) {
  const [openEmailId, setOpenEmailId] = useState<string | null>(null);

  // Mount the SSE listener for real-time updates
  useSSE();

  // Trigger initial background syncs so the Postgres cache gets populated
  useEffect(() => {
    if (isGmailConnected) {
      fetch('/api/mail/sync', { method: 'POST' }).catch(console.error);
    }
    if (isCalendarConnected) {
      fetch('/api/calendar/sync', { method: 'POST' }).catch(console.error);
    }
  }, [isGmailConnected, isCalendarConnected]);

  return (
    <div className="mt-8 flex flex-1 overflow-hidden rounded-3xl bg-card/20 backdrop-blur-3xl shadow-2xl border border-white/5">
      {/* Inbox Panel */}
      <div className="flex w-2/3 flex-col border-r border-white/5 bg-background/40">
        {isGmailConnected ? (
          <InboxPanel openEmailId={openEmailId} setOpenEmailId={setOpenEmailId} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground p-12 text-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <Mail className="h-8 w-8 opacity-20" />
              <p>Connect Gmail to see your Inbox</p>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Panel */}
      <div className="flex w-1/3 flex-col bg-card/10">
        {isCalendarConnected ? (
          <SchedulePanel onOpenEmail={setOpenEmailId} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground p-12 text-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <Calendar className="h-8 w-8 opacity-20" />
              <p>Connect Google Calendar to see your Schedule</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
