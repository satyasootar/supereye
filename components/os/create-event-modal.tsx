'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, ReactNode, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/utils';

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

export function CreateEventModal({ 
  trigger,
  initialDate,
  initialStartTime,
  initialEndTime,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  colorId: controlledColorId,
  onColorIdChange: controlledOnColorIdChange
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
  const [date, setDate] = useState(() => initialDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(() => initialStartTime || '09:00');
  const [endTime, setEndTime] = useState(() => initialEndTime || '10:00');
  const [attendees, setAttendees] = useState('');
  const [availability, setAvailability] = useState<any>(null);

  useEffect(() => {
    if (open) {
      if (initialDate) setDate(initialDate);
      if (initialStartTime) setStartTime(initialStartTime);
      if (initialEndTime) setEndTime(initialEndTime);
      setSummary('');
      setAttendees('');
      setAvailability(null);
    }
  }, [open, initialDate, initialStartTime, initialEndTime]);
  
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create event');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
      setOpen(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

    const attendeeList = attendees.split(',').map(e => ({ email: e.trim() })).filter(e => e.email);

    createMutation.mutate({
      summary,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
      attendees: attendeeList.length > 0 ? attendeeList : undefined,
      colorId: colorId
    });
  };

  const checkAvailability = async () => {
    if (!attendees) return;
    const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();
    const attendeeList = attendees.split(',').map(e => ({ id: e.trim() })).filter(e => e.id);
    
    try {
      const res = await fetch('/api/calendar/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeMin: startDateTime,
          timeMax: endDateTime,
          items: attendeeList
        })
      });
      const data = await res.json();
      setAvailability(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[450px] bg-bg-surface border-border-strong text-text-primary p-6 shadow-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-semibold text-text-primary leading-tight">Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-[13px] font-medium text-text-secondary">Event Title</label>
            <Input 
              id="title" 
              value={summary} 
              onChange={(e) => setSummary(e.target.value)} 
              placeholder="e.g. Sync Meeting" 
              required
              className="rounded-md h-10 bg-bg-overlay border-border-default text-text-primary placeholder:text-text-muted transition-all"
            />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="date" className="text-[13px] font-medium text-text-secondary">Date</label>
            <Input 
              id="date" 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required
              className="rounded-md h-10 bg-bg-overlay border-border-default text-text-primary transition-all [color-scheme:dark]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="start" className="text-[13px] font-medium text-text-secondary">Start Time</label>
              <Input 
                id="start" 
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
                required
                className="rounded-md h-10 bg-bg-overlay border-border-default text-text-primary transition-all [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="end" className="text-[13px] font-medium text-text-secondary">End Time</label>
              <Input 
                id="end" 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
                required
                className="rounded-md h-10 bg-bg-overlay border-border-default text-text-primary transition-all [color-scheme:dark]"
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
                    "h-6 w-6 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface hover:scale-110 shadow-sm border border-black/10 cursor-pointer",
                    color.bg,
                    colorId === color.id ? "ring-2 ring-white ring-offset-2 ring-offset-bg-surface scale-110 border-transparent" : "opacity-80 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label htmlFor="attendees" className="text-[13px] font-medium text-text-secondary flex justify-between items-center">
              <span>Attendees <span className="text-text-muted font-normal">(comma separated)</span></span>
            </label>
            <div className="flex gap-2">
              <Input 
                id="attendees" 
                value={attendees} 
                onChange={(e) => setAttendees(e.target.value)} 
                placeholder="user1@example.com, user2@example.com" 
                className="rounded-md h-10 bg-bg-overlay border-border-default text-text-primary placeholder:text-text-muted transition-all"
              />
              {attendees && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-md h-10 px-4 bg-bg-highlight border-border-strong hover:bg-bg-overlay text-[13px] font-medium flex-shrink-0 cursor-pointer" 
                  onClick={checkAvailability}
                >
                  Check Availability
                </Button>
              )}
            </div>
            {availability && (
              <div className="text-[12px] bg-bg-overlay p-3 rounded-md mt-2 max-h-32 overflow-y-auto custom-scrollbar border border-border-subtle text-text-secondary font-mono">
                <pre>{JSON.stringify(availability.calendars, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-border-subtle">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="rounded-md h-10 text-[14px] px-5 hover:bg-bg-overlay font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending} 
              className="rounded-md bg-accent-blue text-white hover:bg-accent-blue/90 h-10 text-[14px] px-6 font-semibold shadow-sm transition-all cursor-pointer"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
