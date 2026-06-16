'use client';

import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  ChevronDown, MoreVertical, List, Mail, PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { CalendarModal } from './calendar-modal';
import { CreateEventModal } from './create-event-modal';

const miniCalDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];





import { useAppStore } from '@/lib/store/app-store';

import { useQuery } from '@tanstack/react-query';
import { isCalendarEventUpcoming } from '@/lib/calendar/event-utils';

export function CalendarSidebar({ 
  variant = 'default',
  forceExpanded = false
}: { 
  variant?: 'default' | 'right-panel' | 'modal';
  forceExpanded?: boolean;
}) {
  const { 
    activeTabs, workspaceMode, setWorkspaceMode, 
    leftSidebarCollapsed, setLeftSidebarCollapsed,
    calendarView, setCalendarView, currentDateStr, setCurrentDateStr
  } = useAppStore();
  const isSplit = !forceExpanded && (activeTabs.length > 1 || (leftSidebarCollapsed && variant !== 'right-panel' && variant !== 'modal'));
  const isCalendarMode = workspaceMode === 'calendar';

  const [upcomingExpanded, setUpcomingExpanded] = useState(true);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const activeDate = useMemo(() => new Date(currentDateStr), [currentDateStr]);
  const [viewedMonth, setViewedMonth] = useState(activeDate.getMonth());
  const [viewedYear, setViewedYear] = useState(activeDate.getFullYear());

  // Keep viewed month/year in sync with the global selected date
  useEffect(() => {
    setViewedMonth(activeDate.getMonth());
    setViewedYear(activeDate.getFullYear());
  }, [currentDateStr, activeDate]);

  const handlePrevMonth = () => {
    setViewedMonth(prev => {
      if (prev === 0) {
        setViewedYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setViewedMonth(prev => {
      if (prev === 11) {
        setViewedYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const monthName = useMemo(() => {
    const d = new Date(viewedYear, viewedMonth, 1);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [viewedMonth, viewedYear]);

  // Generate a grid of 42 cells (6 rows) starting from the Sunday before/on the 1st of viewedMonth
  const miniCalDates = useMemo(() => {
    const firstDayOfMonth = new Date(viewedYear, viewedMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const dates: Date[] = [];
    const startDate = new Date(viewedYear, viewedMonth, 1 - startDayOfWeek);
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [viewedMonth, viewedYear]);

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar', 'events'],
    queryFn: async () => {
      const res = await fetch('/api/calendar/events');
      if (!res.ok) throw new Error('Failed to fetch calendar events');
      const json = await res.json();
      return json.events as any[];
    }
  });

  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const eventDates = useMemo(() => {
    const set = new Set<string>();
    if (!events) return set;
    events.forEach(evt => {
      const dateStr = evt.start?.dateTime || evt.start?.date;
      if (dateStr) {
        const d = new Date(dateStr);
        set.add(formatDateKey(d));
      }
    });
    return set;
  }, [events]);

  const upcomingEventsList = useMemo(() => {
    return [...(events || [])]
      .filter((evt) => isCalendarEventUpcoming(evt, now))
      .sort(
        (a, b) =>
          new Date(a.start?.dateTime || a.start?.date).getTime() -
          new Date(b.start?.dateTime || b.start?.date).getTime()
      )
      .slice(0, 5);
  }, [events, now]);
  const isTodayDate = (d: Date) => {
    return d.getDate() === now.getDate() &&
           d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
  };

  const isSelectedDate = (d: Date) => {
    return d.getDate() === activeDate.getDate() &&
           d.getMonth() === activeDate.getMonth() &&
           d.getFullYear() === activeDate.getFullYear();
  };

  const isCurrentMonth = (d: Date) => {
    return d.getMonth() === viewedMonth && d.getFullYear() === viewedYear;
  };

  const getStartOfWeek = (d: Date) => {
    const start = new Date(d);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  };

  if (isSplit && variant !== 'right-panel') {
    return (
      <div className="flex h-full w-[48px] flex-col items-center border-r border-border-subtle bg-bg-surface text-text-primary py-3 gap-3 flex-shrink-0">
        {/* Toggle Expand (only if not forced split view by activeTabs) */}
        {leftSidebarCollapsed && activeTabs.length <= 1 && (
          <button
            onClick={() => setLeftSidebarCollapsed(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}

        <CreateEventModal trigger={
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-blue text-white hover:bg-accent-blue-dim transition-colors" title="New Event">
            <Plus className="h-4 w-4" />
          </button>
        } />
        <div className="flex flex-col gap-2 mt-4">
          <button title="Day View" onClick={() => setCalendarView('Day')} className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[13px] cursor-pointer", calendarView === 'Day' ? "bg-bg-highlight text-accent-blue font-bold" : "text-text-secondary hover:bg-bg-overlay hover:text-text-primary")}>D</button>
          <button title="Week View" onClick={() => setCalendarView('Week')} className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[13px] cursor-pointer", calendarView === 'Week' ? "bg-bg-highlight text-accent-blue font-bold" : "text-text-secondary hover:bg-bg-overlay hover:text-text-primary")}>W</button>
          <button title="Month View" onClick={() => setCalendarView('Month')} className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[13px] cursor-pointer", calendarView === 'Month' ? "bg-bg-highlight text-accent-blue font-bold" : "text-text-secondary hover:bg-bg-overlay hover:text-text-primary")}>M</button>
          <button title="Year View" onClick={() => setCalendarView('Year')} className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors text-[13px] cursor-pointer", calendarView === 'Year' ? "bg-bg-highlight text-accent-blue font-bold" : "text-text-secondary hover:bg-bg-overlay hover:text-text-primary")}>Y</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-bg-surface text-text-primary overflow-y-auto custom-scrollbar">
      {/* New Event Button at the top for default (left) panel view, matching the Compose button styling in EmailSidebar */}
      {variant === 'default' && (
        <div className="px-3 py-2 border-b border-border-subtle flex-shrink-0">
          <CreateEventModal trigger={
            <button 
              className="flex w-full h-10 items-center justify-center gap-2 rounded-md bg-accent-blue text-[14px] font-semibold text-white shadow-sm hover:bg-accent-blue-dim transition-colors group relative"
              title="New Event"
            >
              <Plus className="h-4 w-4" />
              New Event
            </button>
          } />
        </div>
      )}
      {/* Mini Calendar Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="font-heading text-[14px] font-semibold">{monthName}</span>
        <div className="flex items-center gap-1">
          {!isCalendarMode && (
            <CalendarModal trigger={
              <button title="Full Calendar" className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors mr-1 cursor-pointer">
                <CalendarIcon className="h-4 w-4" />
              </button>
            } />
          )}
          <button 
            onClick={handlePrevMonth}
            className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mini Calendar Grid */}
      <div className="px-4 pb-4 border-b border-border-subtle">
        <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-center mb-1">
          {miniCalDays.map(day => (
            <div key={day} className="text-[10px] font-mono text-text-muted">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-center">
          {miniCalDates.map((dateObj, i) => {
            const isToday = isTodayDate(dateObj);
            const isSelected = isSelectedDate(dateObj);
            const isCurrMonth = isCurrentMonth(dateObj);
            const dateKey = formatDateKey(dateObj);
            const hasEvent = eventDates.has(dateKey);
            const isWeekView = calendarView === 'Week';
            
            // Check if cell is in the same week as activeDate
            const inActiveWeek = isWeekView && (getStartOfWeek(dateObj) === getStartOfWeek(activeDate));

            return (
              <div 
                key={i} 
                onClick={() => setCurrentDateStr(dateObj.toISOString())}
                className={cn(
                  "relative flex h-8 w-full items-center justify-center text-[12px] cursor-pointer transition-colors select-none",
                  isCurrMonth 
                    ? "text-text-primary" 
                    : "text-text-muted/30 hover:text-text-secondary",
                  inActiveWeek 
                    ? "bg-accent-blue/15 text-accent-blue font-medium" 
                    : "hover:bg-bg-overlay rounded-full",
                  inActiveWeek && i % 7 === 0 && "rounded-l-full",
                  inActiveWeek && i % 7 === 6 && "rounded-r-full"
                )}
              >
                <span className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                  isSelected 
                    ? "bg-accent-blue text-white hover:bg-accent-blue-dim font-bold shadow-sm" 
                    : isToday 
                      ? "border border-accent-blue/40 text-accent-blue font-bold" 
                      : ""
                )}>
                  {dateObj.getDate()}
                </span>
                {hasEvent && !isSelected && (
                  <div className={cn(
                    "absolute bottom-0.5 h-1 w-1 rounded-full",
                    isToday ? "bg-accent-blue" : "bg-text-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>





      <div className="mt-4 px-2 flex-1">
        <button 
          onClick={() => setUpcomingExpanded(!upcomingExpanded)}
          className="flex items-center gap-1 px-2 mb-2 text-[12px] font-semibold text-text-secondary hover:text-text-primary uppercase tracking-wider"
        >
          <ChevronDown className={cn("h-4 w-4 text-text-muted transition-transform", !upcomingExpanded && "-rotate-90")} />
          Upcoming
        </button>

        {upcomingExpanded && (
          <div className="flex flex-col mt-2 px-1 gap-2">
            {isLoading ? (
              <div className="text-[13px] text-text-muted px-2">Loading...</div>
            ) : upcomingEventsList.length === 0 ? (
              <div className="text-[13px] text-text-muted px-2">No upcoming events.</div>
            ) : (
              upcomingEventsList.map((evt, i) => {
                const d = new Date(evt.start?.dateTime || evt.start?.date);
                const isAllDay = !evt.start?.dateTime;
                const timeStr = isAllDay ? 'All day' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const todayDate = new Date();
                const isToday = d.getDate() === todayDate.getDate() && 
                                d.getMonth() === todayDate.getMonth() && 
                                d.getFullYear() === todayDate.getFullYear();
                const dateStr = isToday ? 'Today' : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                
                return (
                  <div key={evt.id || i} className="group relative flex gap-3 rounded-lg p-2 hover:bg-bg-overlay cursor-pointer transition-colors">
                    <div className="mt-1 flex h-2 w-2 flex-shrink-0 rounded-full bg-accent-blue" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-[13.5px] font-medium text-text-primary group-hover:text-accent-blue transition-colors">
                        {evt.summary || '(No title)'}
                      </span>
                      <span className="truncate text-[12px] text-text-secondary">
                        {dateStr}, {timeStr}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Quick Create Button - Only show at bottom for right-panel variant */}
      {variant === 'right-panel' && (
        <div className="p-3 border-t border-border-subtle mt-auto flex-shrink-0">
          <CreateEventModal trigger={
            <button className="flex w-full h-9 items-center justify-center gap-2 rounded-md bg-bg-highlight border border-accent-blue/30 text-[13px] font-semibold text-accent-blue shadow-sm hover:bg-accent-blue hover:text-white transition-colors group">
              <Plus className="h-4 w-4" />
              New Event
            </button>
          } />
        </div>
      )}
    </div>
  );
}
