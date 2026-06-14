'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, ReactNode, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendeePicker, type Attendee } from '@/components/os/attendee-picker';

export const GOOGLE_COLORS = [
  { id: '1', name: 'Lavender', bg: 'bg-[#a4bdfc]', hex: '#a4bdfc', text: 'text-[#1d1d1d]' },
  { id: '2', name: 'Sage', bg: 'bg-[#7ae7bf]', hex: '#7ae7bf', text: 'text-[#1d1d1d]' },
  { id: '3', name: 'Grape', bg: 'bg-[#dbadff]', hex: '#dbadff', text: 'text-[#1d1d1d]' },
  { id: '4', name: 'Flamingo', bg: 'bg-[#ff887c]', hex: '#ff887c', text: 'text-[#1d1d1d]' },
  { id: '5', name: 'Banana', bg: 'bg-[#fbd75b]', hex: '#fbd75b', text: 'text-[#1d1d1d]' },
  { id: '6', name: 'Tangerine', bg: 'bg-[#ffb878]', hex: '#ffb878', text: 'text-[#1d1d1d]' },
  { id: '7', name: 'Peacock', bg: 'bg-[#46d6db]', hex: '#46d6db', text: 'text-[#1d1d1d]' },
  { id: '8', name: 'Graphite', bg: 'bg-[#e1e1e1]', hex: '#e1e1e1', text: 'text-[#1d1d1d]' },
  { id: '9', name: 'Blueberry', bg: 'bg-[#5484ed]', hex: '#5484ed', text: 'text-white' },
  { id: '10', name: 'Basil', bg: 'bg-[#51b749]', hex: '#51b749', text: 'text-white' },
  { id: '11', name: 'Tomato', bg: 'bg-[#dc2127]', hex: '#dc2127', text: 'text-white' },
];

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function CreateEventModal({
  trigger,
  initialDate,
  initialStartTime,
  initialEndTime,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  colorId: controlledColorId,
  onColorIdChange: controlledOnColorIdChange,
}: {
  trigger?: ReactNode;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  colorId?: string;
  onColorIdChange?: (colorId: string) => void;
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setLocalOpen;

  const [localColorId, setLocalColorId] = useState('9');
  const colorId = controlledColorId !== undefined ? controlledColorId : localColorId;
  const setColorId = controlledOnColorIdChange !== undefined ? controlledOnColorIdChange : setLocalColorId;

  const [summary, setSummary] = useState('');
  const [date, setDate] = useState(() => initialDate || getLocalDateString());
  const [startTime, setStartTime] = useState(() => initialStartTime || '09:00');
  const [endTime, setEndTime] = useState(() => initialEndTime || '10:00');
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [addGoogleMeet, setAddGoogleMeet] = useState(true);
  const [availability, setAvailability] = useState<any>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialDate) setDate(initialDate);
      if (initialStartTime) setStartTime(initialStartTime);
      if (initialEndTime) setEndTime(initialEndTime);
      setSummary('');
      setAttendees([]);
      setAddGoogleMeet(true);
      setAvailability(null);
      setCreateError(null);
    }
  }, [open, initialDate, initialStartTime, initialEndTime]);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : 'Failed to create event');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
      setOpen(false);
    },
    onError: (error: Error) => {
      setCreateError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const todayStr = getLocalDateString();
    if (date < todayStr) {
      setCreateError('Cannot create events in the past');
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

    const attendeeList = attendees.map((a) => ({ email: a.email }));

    createMutation.mutate({
      summary,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
      attendees: attendeeList.length > 0 ? attendeeList : undefined,
      colorId,
      addGoogleMeet,
    });
  };

  const checkAvailability = async () => {
    if (attendees.length === 0) return;
    const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();
    const attendeeList = attendees.map((a) => ({ id: a.email }));

    try {
      const res = await fetch('/api/calendar/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeMin: startDateTime,
          timeMax: endDateTime,
          items: attendeeList,
        }),
      });
      const data = await res.json();
      setAvailability(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border-strong bg-bg-surface p-6 text-text-primary shadow-2xl sm:max-w-[480px] custom-scrollbar">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-semibold leading-tight text-text-primary">
            Create New Event
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-[13px] font-medium text-text-secondary">
              Event Title
            </label>
            <Input
              id="title"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Sync Meeting"
              required
              className="h-10 rounded-md border-border-default bg-bg-overlay text-text-primary placeholder:text-text-muted"
            />
          </div>

          <button
            type="button"
            onClick={() => setAddGoogleMeet((v) => !v)}
            className={cn(
              'flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors',
              addGoogleMeet
                ? 'border-accent-blue/35 bg-accent-blue/10 text-text-primary'
                : 'border-border-default bg-bg-overlay text-text-secondary hover:border-border-strong'
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md border',
                addGoogleMeet
                  ? 'border-accent-blue/30 bg-bg-elevated text-accent-blue'
                  : 'border-border-subtle bg-bg-surface text-text-muted'
              )}
            >
              <Video className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-[13px] font-medium">Add Google Meet</span>
              <span className="block text-[12px] text-text-muted">
                Generate a video link for this event
              </span>
            </span>
            <span
              className={cn(
                'h-5 w-9 rounded-full border transition-colors',
                addGoogleMeet
                  ? 'border-accent-blue bg-accent-blue'
                  : 'border-border-default bg-bg-surface'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 block h-4 w-4 rounded-full bg-white transition-transform',
                  addGoogleMeet ? 'translate-x-4' : 'translate-x-0.5'
                )}
              />
            </span>
          </button>

          <div className="space-y-1.5">
            <label htmlFor="date" className="text-[13px] font-medium text-text-secondary">
              Date
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={getLocalDateString()}
              className="h-10 rounded-md border-border-default bg-bg-overlay text-text-primary [color-scheme:dark]"
            />
            {date < getLocalDateString() && (
              <p className="text-[12px] text-destructive mt-1">
                Cannot create events in the past.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="start" className="text-[13px] font-medium text-text-secondary">
                Start Time
              </label>
              <Input
                id="start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="h-10 rounded-md border-border-default bg-bg-overlay text-text-primary [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="end" className="text-[13px] font-medium text-text-secondary">
                End Time
              </label>
              <Input
                id="end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="h-10 rounded-md border-border-default bg-bg-overlay text-text-primary [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="text-[13px] font-medium text-text-secondary">Event Color</label>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {GOOGLE_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setColorId(color.id)}
                  title={color.name}
                  className={cn(
                    'h-6 w-6 cursor-pointer rounded-full border border-black/10 shadow-sm transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface',
                    color.bg,
                    colorId === color.id
                      ? 'scale-110 border-transparent ring-2 ring-white ring-offset-2 ring-offset-bg-surface'
                      : 'opacity-80 hover:opacity-100'
                  )}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-text-secondary">Guests</label>
              {attendees.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-md border-border-strong bg-bg-highlight px-3 text-[12px] font-medium"
                  onClick={checkAvailability}
                >
                  Check availability
                </Button>
              )}
            </div>
            <AttendeePicker value={attendees} onChange={setAttendees} />
            {availability && (
              <div className="custom-scrollbar mt-2 max-h-32 overflow-y-auto rounded-md border border-border-subtle bg-bg-overlay p-3 font-mono text-[12px] text-text-secondary">
                <pre>{JSON.stringify(availability.calendars, null, 2)}</pre>
              </div>
            )}
          </div>

          {createError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
              {createError}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-3 border-t border-border-subtle pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="h-10 rounded-md px-5 text-[14px] font-medium hover:bg-bg-overlay"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || date < getLocalDateString()}
              className="h-10 rounded-md bg-accent-blue px-6 text-[14px] font-semibold text-white shadow-sm hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? 'Creating…' : addGoogleMeet ? 'Create with Meet' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
