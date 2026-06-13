'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function CreateEventModal({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [attendees, setAttendees] = useState('');
  const [availability, setAvailability] = useState<any>(null);
  
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
      attendees: attendeeList.length > 0 ? attendeeList : undefined
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
      <DialogTrigger asChild>
        {trigger || <Button>Create Event</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-bg-surface border-border-strong text-text-primary">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Event Title</label>
            <Input 
              id="title" 
              value={summary} 
              onChange={(e) => setSummary(e.target.value)} 
              placeholder="e.g. Sync Meeting" 
              required
              className="bg-bg-overlay border-border-subtle"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">Date</label>
            <Input 
              id="date" 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required
              className="bg-bg-overlay border-border-subtle"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start" className="text-sm font-medium">Start Time</label>
              <Input 
                id="start" 
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)} 
                required
                className="bg-bg-overlay border-border-subtle"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end" className="text-sm font-medium">End Time</label>
              <Input 
                id="end" 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)} 
                required
                className="bg-bg-overlay border-border-subtle"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="attendees" className="text-sm font-medium">Attendees (comma separated)</label>
            <Input 
              id="attendees" 
              value={attendees} 
              onChange={(e) => setAttendees(e.target.value)} 
              placeholder="user@example.com, user2@example.com" 
              className="bg-bg-overlay border-border-subtle"
            />
            {attendees && (
              <Button type="button" variant="outline" size="sm" onClick={checkAvailability}>
                Check Availability
              </Button>
            )}
            {availability && (
              <div className="text-[12px] bg-bg-overlay p-2 rounded max-h-24 overflow-y-auto">
                <pre>{JSON.stringify(availability.calendars, null, 2)}</pre>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-accent-blue text-white hover:bg-accent-blue/90">
              {createMutation.isPending ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
