'use client';

import { SchedulePanel } from './schedule-panel';
import { InboxPanel } from './inbox-panel';
import { Mail, Calendar } from 'lucide-react';

interface DailyBriefProps {
  isGmailConnected: boolean;
  isCalendarConnected: boolean;
}

export function DailyBrief({ isGmailConnected, isCalendarConnected }: DailyBriefProps) {
  return (
    <div className="mt-4 flex flex-1 overflow-hidden rounded-2xl border border-border/50 bg-card/50 shadow-sm">
      {/* Inbox Panel */}
      <div className="flex w-2/3 flex-col border-r border-border/50 bg-card/30">
        {isGmailConnected ? (
          <InboxPanel />
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
      <div className="flex w-1/3 flex-col bg-background/50">
        {isCalendarConnected ? (
          <SchedulePanel />
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
