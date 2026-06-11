'use client';

import { useQuery } from '@tanstack/react-query';
import { format, isSameDay, parseISO } from 'date-fns';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: any[];
  htmlLink?: string;
  status?: string;
}

export function SchedulePanel() {
  const { data, isLoading, error } = useQuery<{ events: Event[] }>({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const res = await fetch('/api/calendar/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json();
    },
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted/50" />
        <div className="flex flex-col gap-4 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-16 w-16 rounded-xl bg-muted/50" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 rounded bg-muted/50" />
                <div className="h-4 w-1/2 rounded bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-red-500">
        <div className="flex flex-col items-center gap-2">
          <Calendar className="h-8 w-8 opacity-50" />
          <p className="text-sm font-medium">Failed to load schedule</p>
        </div>
      </div>
    );
  }

  const events = data?.events || [];
  const today = new Date();

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Today's Schedule</h2>
          <p className="text-sm text-muted-foreground">
            {format(today, 'EEEE, MMMM do')}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
          <Calendar className="h-5 w-5" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {events.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Clock className="h-8 w-8 opacity-20" />
            <p className="text-sm">No more events today. Enjoy your time!</p>
          </div>
        ) : (
          <div className="relative border-l border-border/50 ml-4 space-y-6 pb-4">
            {events.map((event) => {
              const isAllDay = !!event.start?.date;
              const startTime = event.start?.dateTime ? parseISO(event.start.dateTime) : null;
              const endTime = event.end?.dateTime ? parseISO(event.end.dateTime) : null;
              
              const isPast = endTime && endTime < today;
              const isCurrent = startTime && endTime && startTime <= today && endTime > today;

              return (
                <div key={event.id} className={cn("relative pl-6 transition-all", isPast ? "opacity-50" : "")}>
                  {/* Timeline Node */}
                  <div className={cn(
                    "absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-background",
                    isCurrent ? "bg-blue-500" : isPast ? "bg-muted-foreground" : "bg-blue-500/50"
                  )} />

                  <div className={cn(
                    "group flex flex-col gap-2 rounded-2xl border border-border/50 p-4 transition-all hover:border-border hover:shadow-md",
                    isCurrent ? "bg-blue-500/5 border-blue-500/20" : "bg-card"
                  )}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <h3 className={cn("font-medium leading-none", isCurrent && "text-blue-500")}>
                          {event.summary || '(No title)'}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                          {isAllDay ? (
                            <span className="flex items-center gap-1 font-medium text-foreground/80">
                              <Clock className="h-3 w-3" /> All Day
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-medium text-foreground/80">
                              <Clock className="h-3 w-3" />
                              {startTime && format(startTime, 'h:mm a')} - {endTime && format(endTime, 'h:mm a')}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <MapPin className="h-3 w-3" /> {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex -space-x-2">
                          {event.attendees.slice(0, 3).map((a, i) => (
                            <div key={a.email || i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground" title={a.email}>
                              {a.displayName?.[0] || a.email?.[0]?.toUpperCase() || '?'}
                            </div>
                          ))}
                          {event.attendees.length > 3 && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
                              +{event.attendees.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
