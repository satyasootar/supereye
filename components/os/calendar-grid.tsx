'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search, Settings, RefreshCw, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useRef } from 'react';
import { EventDetailsModal } from './event-details-modal';
import { CreateEventModal, GOOGLE_COLORS } from './create-event-modal';
import { useAppStore } from '@/lib/store/app-store';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CalendarEvent = {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  linkedEmailId?: string;
  colorId?: string;
};

const googleColorMap: Record<string, string> = {
  '1': 'bg-[#a4bdfc]/25 text-[#2b428d] border border-[#a4bdfc]/50 dark:bg-[#a4bdfc]/15 dark:text-[#a4bdfc] dark:border-[#a4bdfc]/30',
  '2': 'bg-[#7ae7bf]/30 text-[#124d35] border border-[#7ae7bf]/60 dark:bg-[#7ae7bf]/15 dark:text-[#7ae7bf] dark:border-[#7ae7bf]/30',
  '3': 'bg-[#dbadff]/30 text-[#541f87] border border-[#dbadff]/60 dark:bg-[#dbadff]/15 dark:text-[#dbadff] dark:border-[#dbadff]/30',
  '4': 'bg-[#ff887c]/25 text-[#911f15] border border-[#ff887c]/50 dark:bg-[#ff887c]/15 dark:text-[#ff887c] dark:border-[#ff887c]/30',
  '5': 'bg-[#fbd75b]/35 text-[#735600] border border-[#fbd75b]/60 dark:bg-[#fbd75b]/15 dark:text-[#fbd75b] dark:border-[#fbd75b]/30',
  '6': 'bg-[#ffb878]/30 text-[#854505] border border-[#ffb878]/50 dark:bg-[#ffb878]/15 dark:text-[#ffb878] dark:border-[#ffb878]/30',
  '7': 'bg-[#46d6db]/25 text-[#05575a] border border-[#46d6db]/50 dark:bg-[#46d6db]/15 dark:text-[#46d6db] dark:border-[#46d6db]/30',
  '8': 'bg-[#e1e1e1]/40 text-[#3a3a3a] border border-[#e1e1e1]/70 dark:bg-[#e1e1e1]/15 dark:text-[#e1e1e1] dark:border-[#e1e1e1]/30',
  '9': 'bg-[#5484ed]/20 text-[#1c3c8a] border border-[#5484ed]/40 dark:bg-[#5484ed]/15 dark:text-[#5484ed] dark:border-[#5484ed]/30',
  '10': 'bg-[#51b749]/25 text-[#1a5215] border border-[#51b749]/50 dark:bg-[#51b749]/15 dark:text-[#51b749] dark:border-[#51b749]/30',
  '11': 'bg-[#dc2127]/20 text-[#8c0e12] border border-[#dc2127]/40 dark:bg-[#dc2127]/15 dark:text-[#dc2127] dark:border-[#dc2127]/30',
};

const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatHourLabel = (h: number) => {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
};

export function CalendarGrid({ isModal = false }: { isModal?: boolean }) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { calendarView, setCalendarView, currentDateStr, setCurrentDateStr } = useAppStore();
  const currentDate = useMemo(() => new Date(currentDateStr), [currentDateStr]);
  
  const setCurrentDate = (updater: Date | ((prev: Date) => Date)) => {
    if (typeof updater === 'function') {
      const nextDate = updater(currentDate);
      setCurrentDateStr(nextDate.toISOString());
    } else {
      setCurrentDateStr(updater.toISOString());
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const parentGridRef = useRef<HTMLDivElement>(null);
  const lastScrollTimeRef = useRef(0);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current < 400) {
      return;
    }

    if (calendarView === 'Year') {
      if (Math.abs(e.deltaY) > 15) {
        lastScrollTimeRef.current = now;
        if (e.deltaY > 0) {
          setCurrentDate(prev => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
        } else {
          setCurrentDate(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
        }
      }
    } else if (calendarView === 'Month') {
      if (Math.abs(e.deltaY) > 15) {
        lastScrollTimeRef.current = now;
        if (e.deltaY > 0) {
          setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        } else {
          setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        }
      }
    } else if (calendarView === 'Week') {
      if (Math.abs(e.deltaX) > 15) {
        lastScrollTimeRef.current = now;
        if (e.deltaX > 0) {
          setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
        } else {
          setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
        }
      }
    } else if (calendarView === 'Day') {
      if (Math.abs(e.deltaX) > 15) {
        lastScrollTimeRef.current = now;
        if (e.deltaX > 0) {
          setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));
        } else {
          setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1));
        }
      }
    }
  };

  const handleHeaderWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastScrollTimeRef.current < 400) {
      return;
    }

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 15) {
      lastScrollTimeRef.current = now;
      const amount = calendarView === 'Week' ? 7 : 1;
      if (delta > 0) {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + amount));
      } else {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - amount));
      }
    }
  };

  // Drag to schedule states
  const [isDragging, setIsDragging] = useState(false);
  const [dragColIndex, setDragColIndex] = useState<number | null>(null);
  const [dragStartHour, setDragStartHour] = useState(0);
  const [dragEndHour, setDragEndHour] = useState(0);
  const [dragColorId, setDragColorId] = useState('9'); // Default to Blueberry (9)

  const activeColorClass = useMemo(() => {
    return googleColorMap[dragColorId] || googleColorMap['9'];
  }, [dragColorId]);

  // Create event states (controlled modal)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState('');
  const [createStartTime, setCreateStartTime] = useState('');
  const [createEndTime, setCreateEndTime] = useState('');

  const now = new Date();

  // Generate 42 cells (6 rows) covering the currently viewed month
  const cells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    
    return Array.from({ length: 42 }, (_, i) => {
      return new Date(year, month, i - startDayOfWeek + 1);
    });
  }, [currentDate]);

  // Generate 7 days for the Week view
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // Align to Sunday
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Timezone string (e.g. GMT+5)
  const tzString = useMemo(() => {
    try {
      const offset = -now.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const hours = Math.floor(Math.abs(offset) / 60);
      return `GMT${sign}${hours}`;
    } catch (e) {
      return 'GMT';
    }
  }, []);

  // Timezone full string (e.g. GMT+05:30)
  const tzStringFull = useMemo(() => {
    try {
      const offset = -now.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
      const mins = String(Math.abs(offset) % 60).padStart(2, '0');
      return `GMT${sign}${hours}:${mins}`;
    } catch (e) {
      return 'GMT';
    }
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const timeLineTop = useMemo(() => {
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    return (currentHour + currentMin / 60) * 64;
  }, [now]);

  const isCurrentWeekVisible = useMemo(() => {
    return weekDays.some(dateObj => 
      dateObj.getDate() === now.getDate() && 
      dateObj.getMonth() === now.getMonth() && 
      dateObj.getFullYear() === now.getFullYear()
    );
  }, [weekDays, now]);

  // Scroll to current time when entering Week/Day view
  useEffect(() => {
    if ((calendarView === 'Week' || calendarView === 'Day') && scrollContainerRef.current) {
      const currentHour = now.getHours();
      const targetHour = Math.max(7, Math.min(currentHour - 2, 18));
      scrollContainerRef.current.scrollTop = targetHour * 64;
    }
  }, [calendarView]);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/calendar/sync', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to sync calendar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
    }
  });

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
    const map: Record<string, any[]> = {};
    if (!data) return map;

    // Filter events by search query if present
    const filteredData = data.filter(evt => 
      !searchQuery || 
      (evt.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (evt.location || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    filteredData.forEach((evt, idx) => {
      const dateStr = evt.start.dateTime || evt.start.date;
      if (!dateStr) return;

      const dateObj = new Date(dateStr);
      const key = formatDateKey(dateObj);
      if (!map[key]) map[key] = [];
      
      let colorClass = evt.colorId ? googleColorMap[evt.colorId] : undefined;
      if (!colorClass) {
        // Fallback to cycling Google colors if no colorId is set
        const cycleColorIds = ['9', '10', '4', '5', '3']; // Blueberry, Basil, Flamingo, Banana, Grape
        const fallbackId = cycleColorIds[idx % cycleColorIds.length];
        colorClass = googleColorMap[fallbackId] || googleColorMap['9'];
        
        const summaryLower = (evt.summary || '').toLowerCase();
        if (summaryLower.includes('christmas') || summaryLower.includes('new year') || summaryLower.includes('holiday') || summaryLower.includes('pongal') || summaryLower.includes('sankranti') || summaryLower.includes('panchami') || summaryLower.includes('ramadan') || summaryLower.includes('jayanti') || summaryLower.includes('buddha') || summaryLower.includes('purnima')) {
          colorClass = googleColorMap['10']; // Basil (Green)
        } else if (summaryLower.includes('anniversary') || summaryLower.includes('birthday') || summaryLower.includes('hackathon')) {
          colorClass = googleColorMap['4']; // Flamingo (Pink/Rose)
        }
      }

      // Calculate timeRaw and durationRaw for placement in hourly grid
      let timeRaw = '09:00';
      let durationRaw = 1.0;
      if (evt.start.dateTime && evt.end.dateTime) {
        const startD = new Date(evt.start.dateTime);
        const endD = new Date(evt.end.dateTime);
        const startH = startD.getHours();
        const startM = startD.getMinutes();
        timeRaw = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
        
        const diffMs = endD.getTime() - startD.getTime();
        durationRaw = Math.max(0.5, diffMs / (1000 * 60 * 60)); // Minimum 30 min duration
      }

      map[key].push({
        id: evt.id,
        title: evt.summary || '(No Title)',
        time: evt.start.dateTime 
          ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          : '',
        isAllDay: !!evt.start.date,
        color: colorClass,
        timeRaw,
        durationRaw
      });
    });

    return map;
  }, [data, searchQuery]);

  const handlePrev = () => {
    if (calendarView === 'Year') {
      setCurrentDate(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
    } else if (calendarView === 'Month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else if (calendarView === 'Week') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1));
    }
  };

  const handleNext = () => {
    if (calendarView === 'Year') {
      setCurrentDate(prev => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
    } else if (calendarView === 'Month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else if (calendarView === 'Week') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));
    }
  };

  // Drag Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only
    if (!parentGridRef.current) return;

    const rect = parentGridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rawHour = y / 64;
    const snapped = Math.max(0, Math.min(24, Math.round(rawHour * 4) / 4)); // Snap to 15-min intervals

    let colIndex = 0;
    if (calendarView === 'Week') {
      const x = e.clientX - rect.left;
      const colWidth = rect.width / 7;
      colIndex = Math.max(0, Math.min(6, Math.floor(x / colWidth)));
    }

    setIsDragging(true);
    setDragColIndex(colIndex);
    setDragStartHour(snapped);
    setDragEndHour(snapped);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || dragColIndex === null || !parentGridRef.current) return;

    const rect = parentGridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rawHour = y / 64;
    const snapped = Math.max(0, Math.min(24, Math.round(rawHour * 4) / 4));

    setDragEndHour(snapped);
  };

  const handleMouseUp = () => {
    if (!isDragging || dragColIndex === null) return;

    setIsDragging(false);

    const finalStart = Math.min(dragStartHour, dragEndHour);
    const finalEnd = Math.max(dragStartHour, dragEndHour);
    // Default to a 1 hour duration if selection is too short or single-click
    const actualEnd = finalStart === finalEnd ? finalStart + 1.0 : finalEnd;

    const startH = Math.floor(finalStart);
    const startM = Math.round((finalStart - startH) * 60);
    const endH = Math.floor(actualEnd);
    const endM = Math.round((actualEnd - endH) * 60);

    const startTimeStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    
    const dateStr = calendarView === 'Week' 
      ? formatDateKey(weekDays[dragColIndex]) 
      : formatDateKey(currentDate);

    setCreateDate(dateStr);
    setCreateStartTime(startTimeStr);
    setCreateEndTime(endTimeStr);
    setIsCreateOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-bg-app overflow-hidden">
      {/* Top Action Bar */}
      <div className={cn(
        "flex h-14 items-center justify-between border-b border-border-subtle bg-bg-base flex-shrink-0",
        isModal ? "pl-6 pr-14" : "px-6"
      )}>
        <div className="flex items-center gap-2">
          {/* Dropdown Selector for Calendar View */}
          <Select 
            value={calendarView} 
            onValueChange={(val) => setCalendarView(val as 'Year' | 'Month' | 'Week' | 'Day')}
          >
            <SelectTrigger className="h-8 border-none bg-transparent hover:bg-bg-overlay/60 text-[13px] font-semibold text-text-secondary hover:text-text-primary focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors cursor-pointer data-[state=open]:bg-bg-overlay/60 data-[state=open]:text-text-primary">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent className="bg-bg-elevated text-text-primary border-border-subtle rounded-md shadow-xl">
              <SelectItem value="Day" className="cursor-pointer">Day</SelectItem>
              <SelectItem value="Week" className="cursor-pointer">Week</SelectItem>
              <SelectItem value="Month" className="cursor-pointer">Month</SelectItem>
              <SelectItem value="Year" className="cursor-pointer">Year</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-4 w-[1px] bg-border-subtle mx-1" />

          <button 
            type="button" 
            onClick={() => setCurrentDate(new Date())}
            className="h-8 px-2.5 rounded-md bg-transparent hover:bg-bg-overlay/60 text-[13px] font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center gap-0.5">
            <button 
              type="button" 
              onClick={handlePrev}
              aria-label="Previous range" 
              className="p-1.5 rounded-md hover:bg-bg-overlay/60 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              type="button" 
              onClick={handleNext}
              aria-label="Next range" 
              className="p-1.5 rounded-md hover:bg-bg-overlay/60 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-border-subtle mx-1" />

          <h2 className="text-[16px] font-bold text-text-primary pl-2 select-none">
            {calendarView === 'Year' 
              ? currentDate.getFullYear().toString()
              : currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <button 
              type="button" 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              title="Sync Calendar" 
              className="p-2 rounded hover:bg-bg-overlay text-text-secondary transition-colors cursor-pointer"
            >
              <RefreshCw className={cn("h-4 w-4", syncMutation.isPending && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {calendarView === 'Year' ? (
        /* ════════════════════ YEAR VIEW GRID ════════════════════ */
        <YearViewGrid currentDate={currentDate} setCurrentDate={setCurrentDate} setCalendarView={setCalendarView} />
      ) : calendarView === 'Month' ? (
        /* ════════════════════ MONTH VIEW GRID ════════════════════ */
        <div onWheel={handleWheel} className="flex flex-col flex-1 bg-bg-app overflow-hidden p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-2 px-1 text-center font-medium text-[12px] text-text-secondary">
            {daysOfWeek.map((day, i) => (
              <div 
                key={day} 
                className={cn(
                  "font-semibold uppercase tracking-wider text-[11px]",
                  i === 6 ? "text-text-primary font-bold" : "text-text-secondary"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 grid-rows-6 flex-1 bg-bg-base border border-border-subtle rounded-lg overflow-hidden">
            {cells.map((dateObj, i) => {
              const dateKey = formatDateKey(dateObj);
              const isToday = dateObj.getDate() === now.getDate() && 
                              dateObj.getMonth() === now.getMonth() && 
                              dateObj.getFullYear() === now.getFullYear();
              const isCurrentMonth = dateObj.getMonth() === currentDate.getMonth() && 
                                     dateObj.getFullYear() === currentDate.getFullYear();
              const events = eventsByDate[dateKey] || [];

              return (
                <div 
                  key={i} 
                  onClick={() => {
                    setCreateDate(dateKey);
                    setCreateStartTime('09:00');
                    setCreateEndTime('10:00');
                    setIsCreateOpen(true);
                  }}
                  className={cn(
                    "relative flex flex-col border-r border-b border-border-subtle min-h-0 bg-bg-base transition-colors cursor-pointer hover:bg-bg-overlay/10",
                    i % 7 === 6 && "border-r-0", 
                    i >= 35 && "border-b-0", 
                    !isCurrentMonth && "bg-bg-app/10" 
                  )}
                >
                  {/* Date Header */}
                  <div className="flex justify-end p-2 select-none">
                    <div className={cn(
                      "flex h-6 min-w-[24px] px-1.5 items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
                      isToday 
                        ? "bg-accent-blue text-white shadow-sm" 
                        : isCurrentMonth 
                          ? "text-text-primary" 
                          : "text-text-muted/40"
                    )}>
                      {dateObj.getDate() === 1 
                        ? `${dateObj.toLocaleString('default', { month: 'long' })} 1` 
                        : dateObj.getDate()}
                    </div>
                  </div>

                  {/* Events Container */}
                  <div className="flex-1 overflow-y-auto no-scrollbar px-1 pb-2 flex flex-col gap-1">
                    {isLoading && dateObj.getDate() === 1 && isCurrentMonth ? (
                      <div className="text-[10px] text-text-muted text-center py-2">Loading...</div>
                    ) : events.map((evt, evtIndex) => (
                      <div 
                        key={evtIndex}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventId(evt.id);
                        }}
                        className={cn(
                          "flex items-center px-2 py-1 mx-1 rounded-[6px] text-[11px] font-semibold cursor-pointer transition-all hover:scale-[1.02] shadow-sm",
                          evt.color
                        )}
                      >
                        {(evt.title.toLowerCase().includes('anniversary') || evt.title.toLowerCase().includes('birthday')) && (
                          <span className="mr-1 text-[10px]" role="img" aria-label="gift">🎁</span>
                        )}
                        
                        <div className="flex items-center gap-1 overflow-hidden">
                          {evt.time && (
                            <span className="opacity-80 flex-shrink-0">{evt.time}</span>
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
      ) : calendarView === 'Week' ? (
        /* ════════════════════ WEEK VIEW GRID ════════════════════ */
        <div className="flex flex-col flex-1 bg-bg-app overflow-hidden p-4">
          {/* Week View Columns Header */}
          <div onWheel={handleHeaderWheel} className="grid grid-cols-[80px_1fr] bg-bg-base/50 text-center select-none flex-shrink-0 border-b border-border-subtle py-3 rounded-t-lg">
            <div className="text-[11px] font-bold text-text-muted flex items-center justify-center border-r border-border-subtle">
              {`+ ${tzString}`}
            </div>
            <div className="grid grid-cols-7 w-full">
              {weekDays.map((dateObj, i) => {
                const isToday = dateObj.getDate() === now.getDate() && 
                                dateObj.getMonth() === now.getMonth() && 
                                dateObj.getFullYear() === now.getFullYear();
                const weekdayName = dateObj.toLocaleString('default', { weekday: 'short' });
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "flex items-center justify-center text-[13px] font-semibold gap-1.5",
                      isToday ? "text-accent-blue" : "text-text-secondary"
                    )}
                  >
                    <span>{weekdayName}</span>
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full font-bold",
                      isToday && "bg-accent-blue text-white shadow-sm"
                    )}>
                      {dateObj.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All-Day Events row */}
          {(() => {
            const hasAnyAllDayEvent = weekDays.some(dateObj => {
              const dateKey = formatDateKey(dateObj);
              const dayEvents = eventsByDate[dateKey] || [];
              return dayEvents.some(e => e.isAllDay);
            });
            if (!hasAnyAllDayEvent) return null;

            return (
              <div className="grid grid-cols-[80px_1fr] border-b border-border-subtle bg-bg-base flex-shrink-0 min-h-[48px] py-1.5">
                <div className="flex items-center justify-center text-[10px] text-text-muted font-bold border-r border-border-subtle">
                  ALL DAY
                </div>
                <div className="grid grid-cols-7 w-full">
                  {weekDays.map((dateObj, i) => {
                    const dateKey = formatDateKey(dateObj);
                    const dayEvents = eventsByDate[dateKey] || [];
                    const allDayEvents = dayEvents.filter(e => e.isAllDay);
                    return (
                      <div key={i} className="px-1 flex flex-col gap-1 border-r border-border-subtle/50 last:border-r-0 justify-center h-full">
                        {allDayEvents.map((evt, idx) => (
                          <div 
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventId(evt.id);
                            }}
                            className={cn(
                              "px-2 py-0.5 rounded-[4px] text-[10px] font-semibold cursor-pointer truncate shadow-sm text-center",
                              evt.color
                            )}
                            title={evt.title}
                          >
                            {evt.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Hourly Scrollable Container */}
          <div 
            ref={scrollContainerRef}
            onWheel={handleWheel}
            className="flex-1 overflow-y-auto no-scrollbar bg-bg-base rounded-b-lg border-x border-b border-border-subtle relative select-none"
          >
            {/* Time Grid Layout */}
            <div className="relative w-full h-[1536px]">
              
              {/* Vertical Column Lines */}
              <div className="absolute inset-0 grid grid-cols-[80px_1fr] pointer-events-none">
                <div className="border-r border-border-subtle h-full" />
                <div className="grid grid-cols-7 h-full">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="border-r border-border-subtle/40 h-full last:border-r-0" />
                  ))}
                </div>
              </div>

              {/* Hourly Rows */}
              {hours.map((h) => (
                <div 
                  key={h} 
                  className="absolute left-0 right-0 grid grid-cols-[80px_1fr] border-b border-border-subtle/30"
                  style={{ top: `${h * 64}px`, height: '64px' }}
                >
                  {/* Hour Label */}
                  <div className="text-right pr-3 pt-1 text-[11px] text-text-muted font-medium select-none">
                    {formatHourLabel(h)}
                  </div>
                  {/* Grid Space */}
                  <div className="h-full w-full" />
                </div>
              ))}

              {/* Render Timed Events Column-wise */}
              <div 
                ref={parentGridRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="absolute top-0 bottom-0 left-[80px] right-0 grid grid-cols-7 pointer-events-auto cursor-crosshair"
              >
                {weekDays.map((dateObj, i) => {
                  const dateKey = formatDateKey(dateObj);
                  const dayEvents = eventsByDate[dateKey] || [];
                  const timedEvents = dayEvents.filter(e => !e.isAllDay);

                  return (
                    <div key={i} className="relative h-full w-full pointer-events-none">
                      {/* Drag Selection Overlay */}
                      {(isDragging || isCreateOpen) && dragColIndex === i && (
                        <div 
                          className={cn(
                            "absolute left-1.5 right-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold pointer-events-none z-10 flex flex-col shadow-sm transition-all",
                            activeColorClass
                          )}
                          style={{ 
                            top: `${Math.min(dragStartHour, dragEndHour) * 64}px`, 
                            height: `${Math.max(16, Math.abs(dragEndHour - dragStartHour) * 64)}px` 
                          }}
                        >
                          <span className="truncate">New Event</span>
                          {Math.abs(dragEndHour - dragStartHour) > 0.5 && (
                            <span className="text-[9px] opacity-80 font-medium truncate mt-0.5">
                              {formatHourLabel(Math.min(dragStartHour, dragEndHour))} - {formatHourLabel(Math.max(dragStartHour, dragEndHour))}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Timed Events */}
                      {timedEvents.map((evt, idx) => {
                        // Calculate positions
                        const [hoursStr, minutesStr] = evt.timeRaw.split(':');
                        const startH = parseInt(hoursStr);
                        const startM = parseInt(minutesStr);
                        
                        const topPos = (startH + startM / 60) * 64;
                        const durationH = evt.durationRaw || 1.0;
                        const heightPos = durationH * 64;

                        return (
                          <div 
                            key={idx}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventId(evt.id);
                            }}
                            className={cn(
                              "absolute left-1.5 right-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold cursor-pointer shadow-sm flex flex-col pointer-events-auto hover:scale-[1.02] hover:shadow-md transition-all",
                              evt.color
                            )}
                            style={{ 
                              top: `${topPos}px`, 
                              height: `${heightPos}px`,
                              minHeight: '28px'
                            }}
                            title={`${evt.title} (${evt.time})`}
                          >
                            <span className="truncate">{evt.title}</span>
                            {heightPos > 32 && (
                              <span className="text-[9px] opacity-80 font-medium truncate mt-0.5">{evt.time}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Current Time Indicator Line */}
              {isCurrentWeekVisible && (
                <div 
                  className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                  style={{ top: `${timeLineTop}px` }}
                >
                  <div className="w-[80px] text-right pr-3 text-[10px] font-bold text-red-500 bg-bg-base select-none">
                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', '')}
                  </div>
                  <div className="flex-1 h-[1.5px] bg-red-500 relative">
                    <div className="absolute left-0 h-2 w-2 rounded-full bg-red-500 -translate-y-[3px] -translate-x-[4px]" />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      ) : (
        /* ════════════════════ DAY VIEW GRID ════════════════════ */
        <div className="flex flex-col flex-1 bg-bg-app overflow-hidden p-4">
          {/* Day View Column Header */}
          <div onWheel={handleHeaderWheel} className="grid grid-cols-[80px_1fr] bg-bg-base/50 select-none flex-shrink-0 border-b border-border-subtle py-2.5 rounded-t-lg">
            <div className="text-[11px] font-bold text-text-muted flex items-center justify-center border-r border-border-subtle">
              {/* Spacer for timezone alignment */}
            </div>
            <div className="flex items-baseline gap-2.5 pl-4 py-1">
              <span className={cn(
                "text-[24px] font-extrabold transition-colors leading-none",
                currentDate.getDate() === now.getDate() && 
                currentDate.getMonth() === now.getMonth() && 
                currentDate.getFullYear() === now.getFullYear()
                  ? "text-accent-blue"
                  : "text-text-primary"
              )}>
                {currentDate.getDate()}
              </span>
              <span className={cn(
                "text-[12px] font-bold uppercase tracking-wider leading-none",
                currentDate.getDate() === now.getDate() && 
                currentDate.getMonth() === now.getMonth() && 
                currentDate.getFullYear() === now.getFullYear()
                  ? "text-accent-blue"
                  : "text-text-secondary"
              )}>
                {currentDate.toLocaleString('default', { weekday: 'long' })}
              </span>
            </div>
          </div>

          {/* All-Day Events row */}
          {(() => {
            const dateKey = formatDateKey(currentDate);
            const dayEvents = eventsByDate[dateKey] || [];
            const allDayEvents = dayEvents.filter(e => e.isAllDay);
            if (allDayEvents.length === 0) return null;

            return (
              <div className="grid grid-cols-[80px_1fr] border-b border-border-subtle bg-bg-base flex-shrink-0 min-h-[48px] py-2">
                <div className="flex items-center justify-center text-[10px] text-text-muted font-bold border-r border-border-subtle">
                  {tzStringFull}
                </div>
                <div className="px-3 flex flex-col gap-1.5 justify-center">
                  {allDayEvents.map((evt, idx) => (
                    <div 
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEventId(evt.id);
                      }}
                      className={cn(
                        "px-3 py-1 rounded-[6px] text-[11px] font-semibold cursor-pointer shadow-sm w-full transition-all hover:scale-[1.01]",
                        evt.color
                      )}
                      title={evt.title}
                    >
                      {evt.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Hourly Scrollable Container */}
          <div 
            ref={scrollContainerRef}
            onWheel={handleWheel}
            className="flex-1 overflow-y-auto no-scrollbar bg-bg-base rounded-b-lg border-x border-b border-border-subtle relative select-none"
          >
            {/* Time Grid Layout */}
            <div className="relative w-full h-[1536px]">
              
              {/* Vertical Column Lines */}
              <div className="absolute inset-0 grid grid-cols-[80px_1fr] pointer-events-none">
                <div className="border-r border-border-subtle h-full" />
                <div className="h-full w-full" />
              </div>

              {/* Hourly Rows */}
              {hours.map((h) => (
                <div 
                  key={h} 
                  className="absolute left-0 right-0 grid grid-cols-[80px_1fr] border-b border-border-subtle/30"
                  style={{ top: `${h * 64}px`, height: '64px' }}
                >
                  {/* Hour Label */}
                  <div className="text-right pr-3 pt-1 text-[11px] text-text-muted font-medium select-none">
                    {formatHourLabel(h)}
                  </div>
                  {/* Grid Space */}
                  <div className="h-full w-full" />
                </div>
              ))}

              {/* Render Timed Events for the Day */}
              <div 
                ref={parentGridRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="absolute top-0 bottom-0 left-[80px] right-0 pointer-events-auto cursor-crosshair"
              >
                <div className="relative h-full w-full pointer-events-none">
                  {/* Drag Selection Overlay */}
                  {(isDragging || isCreateOpen) && dragColIndex === 0 && (
                    <div 
                      className={cn(
                        "absolute left-3 right-3 rounded-md px-3 py-2 text-[12px] font-semibold pointer-events-none z-10 flex flex-col shadow-sm transition-all",
                        activeColorClass
                      )}
                      style={{ 
                        top: `${Math.min(dragStartHour, dragEndHour) * 64}px`, 
                        height: `${Math.max(16, Math.abs(dragEndHour - dragStartHour) * 64)}px` 
                      }}
                    >
                      <span className="truncate">New Event</span>
                      {Math.abs(dragEndHour - dragStartHour) > 0.5 && (
                        <span className="text-[10px] opacity-80 font-medium truncate mt-0.5">
                          {formatHourLabel(Math.min(dragStartHour, dragEndHour))} - {formatHourLabel(Math.max(dragStartHour, dragEndHour))}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Timed Events */}
                  {(() => {
                    const dateKey = formatDateKey(currentDate);
                    const dayEvents = eventsByDate[dateKey] || [];
                    const timedEvents = dayEvents.filter(e => !e.isAllDay);
                    return timedEvents.map((evt, idx) => {
                      const [hoursStr, minutesStr] = evt.timeRaw.split(':');
                      const startH = parseInt(hoursStr);
                      const startM = parseInt(minutesStr);
                      
                      const topPos = (startH + startM / 60) * 64;
                      const durationH = evt.durationRaw || 1.0;
                      const heightPos = durationH * 64;

                      return (
                        <div 
                          key={idx}
                          onMouseDown={(e) => e.stopPropagation()}
                          onMouseUp={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEventId(evt.id);
                          }}
                          className={cn(
                            "absolute left-3 right-3 rounded-md px-3 py-2 text-[12px] font-semibold cursor-pointer shadow-sm flex flex-col pointer-events-auto hover:scale-[1.01] hover:shadow-md transition-all",
                            evt.color
                          )}
                          style={{ 
                            top: `${topPos}px`, 
                            height: `${heightPos}px`,
                            minHeight: '28px'
                          }}
                          title={`${evt.title} (${evt.time})`}
                        >
                          <span className="truncate">{evt.title}</span>
                          {heightPos > 36 && (
                            <span className="text-[10px] opacity-80 font-medium truncate mt-0.5">{evt.time}</span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Current Time Indicator Line */}
              {currentDate.getDate() === now.getDate() && 
               currentDate.getMonth() === now.getMonth() && 
               currentDate.getFullYear() === now.getFullYear() && (
                <div 
                  className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                  style={{ top: `${timeLineTop}px` }}
                >
                  <div className="w-[80px] text-right pr-3 text-[10px] font-bold text-red-500 bg-bg-base select-none">
                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', '')}
                  </div>
                  <div className="flex-1 h-[1.5px] bg-red-500 relative">
                    <div className="absolute left-0 h-2 w-2 rounded-full bg-red-500 -translate-y-[3px] -translate-x-[4px]" />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* View/Details Event Modal */}
      <EventDetailsModal 
        eventId={selectedEventId} 
        open={!!selectedEventId} 
        onOpenChange={(open) => !open && setSelectedEventId(null)} 
      />

      {/* Drag to Create Event Modal */}
      <CreateEventModal 
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setDragColIndex(null);
          }
        }}
        initialDate={createDate}
        initialStartTime={createStartTime}
        initialEndTime={createEndTime}
        colorId={dragColorId}
        onColorIdChange={setDragColorId}
      />
    </div>
  );
}

function YearViewGrid({ 
  currentDate, 
  setCurrentDate, 
  setCalendarView 
}: { 
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  setCalendarView: (view: 'Month' | 'Week' | 'Day' | 'Year') => void;
}) {
  const year = currentDate.getFullYear();
  const now = new Date();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthCells = (y: number, m: number) => {
    const firstDayOfMonth = new Date(y, m, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    return Array.from({ length: 42 }, (_, i) => {
      return new Date(y, m, i - startDayOfWeek + 1);
    });
  };

  const isTodayDate = (d: Date) => {
    return d.getDate() === now.getDate() &&
           d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
  };

  const isSelectedDate = (d: Date) => {
    return d.getDate() === currentDate.getDate() &&
           d.getMonth() === currentDate.getMonth() &&
           d.getFullYear() === currentDate.getFullYear();
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-bg-app p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-10 max-w-7xl mx-auto">
        {months.map((monthName, m) => {
          const cells = getMonthCells(year, m);
          return (
            <div key={m} className="flex flex-col select-none text-left">
              {/* Month Header */}
              <button
                type="button"
                onClick={() => {
                  setCurrentDate(new Date(year, m, 1));
                  setCalendarView('Month');
                }}
                className="text-[14px] font-bold text-text-primary hover:text-accent-blue transition-colors text-left mb-3 w-fit cursor-pointer"
              >
                {monthName}
              </button>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-text-secondary/60 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className={cn(i === 0 || i === 6 ? "text-text-muted/65" : "text-text-secondary/60")}>{day}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-y-1 gap-x-0.5 text-center">
                {cells.map((dateObj, i) => {
                  const isToday = isTodayDate(dateObj);
                  const isSelected = isSelectedDate(dateObj);
                  const isCurrMonth = dateObj.getMonth() === m;

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setCurrentDate(dateObj);
                        setCalendarView('Day');
                      }}
                      className={cn(
                        "flex h-6 w-full items-center justify-center text-[11px] cursor-pointer transition-colors relative hover:bg-bg-overlay/50 rounded-full",
                        !isCurrMonth && "text-text-muted/20 hover:text-text-muted/40",
                        isCurrMonth && !isToday && !isSelected && "text-text-primary"
                      )}
                    >
                      <span className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10.5px]",
                        isSelected && "bg-accent-blue text-white font-bold shadow-sm",
                        isToday && !isSelected && "border border-accent-blue/40 text-accent-blue font-bold"
                      )}>
                        {dateObj.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
