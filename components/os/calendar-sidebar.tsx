'use client';

import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  ChevronDown, MoreVertical, List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const miniCalDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Basic static generation for June 2026 (starts Monday, 30 days)
const miniCalDates = Array.from({ length: 35 }, (_, i) => {
  const date = i - 0; // Padding before the 1st
  if (date < 1 || date > 30) return null;
  return date;
});

const myCalendars = [
  { name: 'satya.sootar06', color: 'bg-red-500', active: true },
  { name: 'Birthdays', color: 'bg-green-500', active: true },
  { name: 'Family', color: 'bg-teal-500', active: true },
  { name: 'Tasks', color: 'bg-blue-500', active: false },
];

const upcomingEvents = [
  { title: 'Team standup', date: 'Today, 3:00 PM', color: 'bg-red-500' },
  { title: 'Meeting — friend@corsair.dev', date: 'Tomorrow, 9:00 AM', color: 'bg-teal-500' },
  { title: 'Muharram/Ashura', date: 'Jun 26, All day', color: 'bg-green-500' },
];

export function CalendarSidebar() {
  const [calsExpanded, setCalsExpanded] = useState(true);
  const [upcomingExpanded, setUpcomingExpanded] = useState(true);
  const [activeView, setActiveView] = useState('Month');

  return (
    <div className="flex h-full w-[260px] flex-col border-r border-border-subtle bg-bg-surface text-text-primary overflow-y-auto custom-scrollbar flex-shrink-0">
      {/* Mini Calendar Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="font-heading text-[14px] font-semibold">June 2026</span>
        <div className="flex items-center gap-1">
          <button className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mini Calendar Grid */}
      <div className="px-4 pb-4 border-b border-border-subtle">
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {miniCalDays.map(day => (
            <div key={day} className="text-[10px] font-mono text-text-muted">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {miniCalDates.map((date, i) => {
            const isToday = date === 11; // Hardcoded "today" for June 2026 mockup
            const hasEvent = [2, 11, 14, 26].includes(date!);
            return (
              <div 
                key={i} 
                className={cn(
                  "relative flex h-7 w-7 items-center justify-center rounded-full text-[12px] cursor-pointer hover:bg-bg-overlay transition-colors mx-auto",
                  !date && "opacity-0 pointer-events-none",
                  isToday ? "bg-accent-blue text-white hover:bg-accent-blue-dim font-bold" : "text-text-secondary hover:text-text-primary"
                )}
              >
                {date}
                {hasEvent && !isToday && (
                  <div className="absolute bottom-1 h-1 w-1 rounded-full bg-text-muted" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* View Switcher */}
      <div className="p-3 border-b border-border-subtle">
        <div className="flex bg-bg-elevated rounded-md p-1 border border-border-subtle">
          {['Day', 'Week', 'Month', 'Agenda'].map(view => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={cn(
                "flex-1 rounded py-1 text-[11px] font-medium transition-colors",
                activeView === view 
                  ? "bg-bg-highlight text-accent-blue shadow-sm" 
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-overlay"
              )}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* My Calendars */}
      <div className="mt-4 px-2">
        <div className="flex items-center justify-between px-2 mb-1 group">
          <button 
            onClick={() => setCalsExpanded(!calsExpanded)}
            className="flex items-center gap-1 text-[12px] font-semibold text-text-secondary hover:text-text-primary uppercase tracking-wider"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", !calsExpanded && "-rotate-90")} />
            My Calendars
          </button>
          <button className="p-1 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {calsExpanded && (
          <div className="flex flex-col gap-0.5 mt-1">
            {myCalendars.map(cal => (
              <div key={cal.name} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-bg-overlay group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-[4px] border",
                    cal.active ? cal.color : "border-border-strong bg-transparent"
                  )}>
                    {cal.active && <div className="h-1.5 w-1.5 rounded-sm bg-white" />}
                  </div>
                  <span className={cn("text-[13px] truncate max-w-[140px]", cal.active ? "text-text-primary font-medium" : "text-text-secondary")}>
                    {cal.name}
                  </span>
                </div>
                <button className="p-0.5 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div className="mt-4 px-2 flex-1">
        <button 
          onClick={() => setUpcomingExpanded(!upcomingExpanded)}
          className="flex items-center gap-1 px-2 mb-2 text-[12px] font-semibold text-text-secondary hover:text-text-primary uppercase tracking-wider"
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform", !upcomingExpanded && "-rotate-90")} />
          Upcoming
        </button>

        {upcomingExpanded && (
          <div className="flex flex-col gap-3 mt-2 px-2">
            {upcomingEvents.map((evt, i) => (
              <div key={i} className="flex flex-col gap-1 hover:bg-bg-overlay p-2 -mx-2 rounded-md cursor-pointer transition-colors group">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-3 w-3 text-text-muted" />
                  <span className="text-[11px] font-mono text-text-secondary group-hover:text-text-primary">{evt.date}</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className={cn("mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0", evt.color)} />
                  <span className="text-[13px] font-medium text-text-primary leading-tight">{evt.title}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Create Button */}
      <div className="p-3 border-t border-border-subtle mt-auto">
        <button className="flex w-full h-9 items-center justify-center gap-2 rounded-md bg-bg-highlight border border-accent-blue/30 text-[13px] font-semibold text-accent-blue shadow-sm hover:bg-accent-blue hover:text-white transition-colors group">
          <Plus className="h-4 w-4" />
          New Event
        </button>
      </div>
    </div>
  );
}
