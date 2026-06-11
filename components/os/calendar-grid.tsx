'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Generate 35 days for a 5-week month view (June 2026 starts on Mon, so 1 empty slot on Sun)
const monthCells = Array.from({ length: 35 }, (_, i) => {
  const date = i - 0; // Offset for Sunday start
  if (date < 1 || date > 30) return null;
  return date;
});

type CalendarEvent = {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  linkedEmailId?: string;
};

export function CalendarGrid() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['calendar', 'events'],
    queryFn: async () => {
      const res = await fetch('/api/calendar/events');
      if (!res.ok) throw new Error('Failed to fetch calendar events');
      const json = await res.json();
      return json.events as CalendarEvent[];
    }
  });

  const eventsByDate = useMemo(() => {
    const map: Record<number, any[]> = {};
    if (!data) return map;

    const colors = ['bg-blue-500', 'bg-red-500', 'bg-teal-500', 'bg-green-500', 'bg-orange-500'];

    data.forEach((evt, idx) => {
      // Find the day of the month this event falls on.
      // E.g. "2026-06-11T10:00:00Z"
      const dateStr = evt.start.dateTime || evt.start.date;
      if (!dateStr) return;

      const dateObj = new Date(dateStr);
      // If it's June 2026, we map it to the day
      if (dateObj.getFullYear() === 2026 && dateObj.getMonth() === 5) {
        const day = dateObj.getDate();
        if (!map[day]) map[day] = [];
        
        map[day].push({
          title: evt.summary || '(No Title)',
          time: evt.start.dateTime 
            ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : '',
          isAllDay: !!evt.start.date,
          color: colors[idx % colors.length]
        });
      }
    });

    return map;
  }, [data]);

  return (
    <div className="flex flex-1 flex-col h-full bg-bg-app overflow-hidden">
      {/* Top Action Bar */}
      <div className="flex h-14 items-center justify-between px-6 border-b border-border-subtle bg-bg-base flex-shrink-0">
        <div className="flex items-center gap-4">
          <button className="px-3 py-1.5 rounded-md border border-border-default hover:bg-bg-overlay text-[13px] font-medium text-text-primary transition-colors shadow-sm">
            Today
          </button>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded hover:bg-bg-overlay text-text-secondary transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="p-1.5 rounded hover:bg-bg-overlay text-text-secondary transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <h2 className="text-[20px] font-heading font-semibold text-text-primary ml-2">
            June 2026
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="h-8 w-48 rounded-full bg-bg-overlay border-none pl-9 pr-3 text-[13px] outline-none focus:ring-1 focus:ring-accent-blue transition-shadow text-text-primary placeholder:text-text-muted"
            />
          </div>
          <button className="p-2 rounded hover:bg-bg-overlay text-text-secondary transition-colors ml-2">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex flex-col flex-1 bg-border-subtle p-[1px] overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-bg-base flex-shrink-0">
          {daysOfWeek.map((day, i) => (
            <div key={day} className="py-2 text-center border-r border-border-subtle last:border-r-0">
              <span className={cn(
                "text-[12px] font-medium uppercase tracking-wider",
                i === 0 || i === 6 ? "text-text-muted" : "text-text-secondary"
              )}>
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 grid-rows-5 flex-1 bg-bg-base border-t border-border-subtle">
          {monthCells.map((date, i) => {
            const isToday = date === 11;
            const events = date ? eventsByDate[date] || [] : [];
            const isWeekend = i % 7 === 0 || i % 7 === 6;

            return (
              <div 
                key={i} 
                className={cn(
                  "relative flex flex-col border-r border-b border-border-subtle min-h-0",
                  isWeekend ? "bg-bg-overlay/30" : "bg-bg-base",
                  i % 7 === 6 && "border-r-0", // Remove right border for last col
                  i >= 28 && "border-b-0" // Remove bottom border for last row
                )}
              >
                {/* Date Header */}
                <div className="flex justify-center p-1">
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-mono",
                    isToday 
                      ? "bg-accent-blue text-white font-bold shadow-sm" 
                      : date 
                        ? "text-text-primary" 
                        : "text-transparent"
                  )}>
                    {date}
                  </div>
                </div>

                {/* Events Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-1 flex flex-col gap-1">
                  {isLoading && date === 1 ? (
                    <div className="text-[10px] text-text-muted text-center py-2">Loading...</div>
                  ) : events.map((evt, evtIndex) => (
                    <div 
                      key={evtIndex}
                      className={cn(
                        "flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors group",
                        evt.isAllDay 
                          ? cn(evt.color.replace('bg-', 'bg-').concat('/20'), "border-l-2", evt.color.replace('bg-', 'border-'), evt.color.replace('bg-', 'text-'))
                          : "hover:bg-bg-overlay"
                      )}
                    >
                      {!evt.isAllDay && (
                        <div className={cn("h-1.5 w-1.5 rounded-full mr-1.5 flex-shrink-0", evt.color)} />
                      )}
                      
                      <div className={cn(
                        "flex items-center gap-1 overflow-hidden",
                        !evt.isAllDay && "text-text-primary group-hover:text-accent-blue"
                      )}>
                        {!evt.isAllDay && (
                          <span className="font-semibold flex-shrink-0">{evt.time}</span>
                        )}
                        <span className="truncate">{evt.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
