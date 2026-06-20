'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Clock, MapPin, Users, Trash, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AttendeePicker, type Attendee } from '@/components/os/attendee-picker';
import { GOOGLE_COLORS } from '@/components/os/create-event-modal';
import {
  calendarEventToFormValues,
  formValuesToUpdatePayload,
  getLocalDateString,
  isCalendarEventEditable,
  type CalendarEventFormValues,
} from '@/lib/calendar/event-utils';

type GoogleCalendarEvent = {
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  colorId?: string | null;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email?: string | null; displayName?: string | null; responseStatus?: string | null }> | null;
};

export function EventDetailsModal({
  eventId,
  open,
  onOpenChange,
}: {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<CalendarEventFormValues | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', 'events', eventId],
    queryFn: async () => {
      const res = await fetch(`/api/calendar/events/${eventId}`);
      if (!res.ok) throw new Error('Failed to fetch event details');
      return res.json() as Promise<{ event: GoogleCalendarEvent }>;
    },
    enabled: !!eventId && open,
  });

  const evt = data?.event;
  const canEdit = evt ? isCalendarEventEditable(evt) : false;

  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      setForm(null);
      setAttendees([]);
      setUpdateError(null);
    }
  }, [open, eventId]);

  useEffect(() => {
    if (!evt || isEditing) return;
    setForm(calendarEventToFormValues(evt));
    setAttendees(
      (evt.attendees ?? [])
        .filter((a): a is { email: string; displayName?: string | null } => !!a.email)
        .map((a) => ({ email: a.email, name: a.displayName ?? undefined }))
    );
  }, [evt, isEditing]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete event');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : 'Failed to update event');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events', eventId] });
      setIsEditing(false);
      setUpdateError(null);
    },
    onError: (error: Error) => {
      setUpdateError(error.message);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setUpdateError(null);

    const todayStr = getLocalDateString();
    if (form.date < todayStr) {
      setUpdateError('Cannot move an event to the past');
      return;
    }

    if (!form.isAllDay) {
      const startMs = new Date(`${form.date}T${form.startTime}:00`).getTime();
      const endMs = new Date(`${form.date}T${form.endTime}:00`).getTime();
      if (endMs <= startMs) {
        setUpdateError('End time must be after start time');
        return;
      }
      if (startMs <= Date.now()) {
        setUpdateError('Start time must be in the future');
        return;
      }
    }

    updateMutation.mutate(
      formValuesToUpdatePayload(
        form,
        attendees.map((a) => ({ email: a.email }))
      )
    );
  };

  const formatEventWhen = (event: GoogleCalendarEvent) => {
    const startLabel = event.start?.dateTime
      ? new Date(event.start.dateTime).toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : event.start?.date
        ? new Date(event.start.date).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
        : '';

    const endLabel = event.end?.dateTime
      ? new Date(event.end.dateTime).toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      : event.end?.date
        ? new Date(event.end.date).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })
        : '';

    return { startLabel, endLabel };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-bg-surface border-border-strong text-text-primary p-0 overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogTitle className="sr-only">
          {isEditing ? 'Edit Event' : 'Event Details'}
        </DialogTitle>
        {isLoading || !evt || !form ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
          </div>
        ) : isEditing ? (
          <form onSubmit={handleSave} className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-left leading-tight text-text-primary">
                Edit Event
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-1.5">
              <label htmlFor="edit-title" className="text-[13px] font-medium text-text-secondary">
                Event Title
              </label>
              <Input
                id="edit-title"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                required
                className="h-10 rounded-md border-border-default bg-bg-overlay text-text-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-date" className="text-[13px] font-medium text-text-secondary">
                Date
              </label>
              <Input
                id="edit-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                min={getLocalDateString()}
                className="h-10 rounded-md border-border-default bg-bg-overlay text-text-primary [color-scheme:dark]"
              />
            </div>

            {!form.isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="edit-start" className="text-[13px] font-medium text-text-secondary">
                    Start Time
                  </label>
                  <Input
                    id="edit-start"
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                    className="h-10 rounded-md border-border-default bg-bg-overlay text-text-primary [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="edit-end" className="text-[13px] font-medium text-text-secondary">
                    End Time
                  </label>
                  <Input
                    id="edit-end"
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    required
                    className="h-10 rounded-md border-border-default bg-bg-overlay text-text-primary [color-scheme:dark]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="edit-location" className="text-[13px] font-medium text-text-secondary">
                Location
              </label>
              <Input
                id="edit-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Optional"
                className="h-10 rounded-md border-border-default bg-bg-overlay text-text-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="edit-description" className="text-[13px] font-medium text-text-secondary">
                Description
              </label>
              <textarea
                id="edit-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-md border border-border-default bg-bg-overlay px-3 py-2 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue"
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-medium text-text-secondary">Event Color</label>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {GOOGLE_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setForm({ ...form, colorId: color.id })}
                    title={color.name}
                    className={cn(
                      'h-6 w-6 cursor-pointer rounded-full border border-black/10 shadow-sm transition-all hover:scale-110',
                      color.bg,
                      form.colorId === color.id
                        ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-bg-surface'
                        : 'opacity-80 hover:opacity-100'
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-medium text-text-secondary">Guests</label>
              <AttendeePicker value={attendees} onChange={setAttendees} />
            </div>

            {updateError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
                {updateError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setUpdateError(null);
                  if (evt) {
                    setForm(calendarEventToFormValues(evt));
                  }
                }}
                className="text-[14px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-accent-blue text-white hover:bg-accent-blue/90 text-[14px] px-6"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="p-6 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold mb-2 text-left leading-tight text-text-primary">
                  {evt.summary}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div className="flex items-start gap-3.5 text-text-secondary">
                  <Clock className="h-5 w-5 mt-0.5 text-text-muted flex-shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-medium text-text-primary">
                      {formatEventWhen(evt).startLabel}
                    </span>
                    <span className="text-[14px] text-text-muted">
                      to {formatEventWhen(evt).endLabel}
                    </span>
                  </div>
                </div>

                {evt.location && (
                  <div className="flex items-start gap-3.5 text-text-secondary">
                    <MapPin className="h-5 w-5 mt-0.5 text-text-muted flex-shrink-0" />
                    <span className="text-[14px] leading-relaxed">{evt.location}</span>
                  </div>
                )}

                {evt.attendees && evt.attendees.length > 0 && (
                  <div className="flex items-start gap-3.5 text-text-secondary">
                    <Users className="h-5 w-5 mt-0.5 text-text-muted flex-shrink-0" />
                    <div className="flex flex-col gap-2 w-full">
                      <span className="text-[14px] font-medium text-text-primary">
                        {evt.attendees.length} guest{evt.attendees.length === 1 ? '' : 's'}
                      </span>
                      <div className="max-h-32 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {evt.attendees.map((a, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2.5 text-[13px] bg-bg-overlay/50 px-2 py-1.5 rounded-md"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
                            <span className="truncate flex-1">{a.email}</span>
                            <span className="text-text-muted text-[11px] bg-bg-surface border border-border-subtle px-1.5 py-0.5 rounded capitalize">
                              {a.responseStatus === 'needsAction' ? 'Pending' : a.responseStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {evt.description && (
                  <div className="pt-5 mt-2 border-t border-border-subtle">
                    <div className="text-[14px] text-text-secondary whitespace-pre-wrap leading-relaxed">
                      {evt.description}
                    </div>
                  </div>
                )}

                {!canEdit && (
                  <p className="text-[13px] text-text-muted bg-bg-overlay/50 rounded-md px-3 py-2">
                    Past events cannot be edited.
                  </p>
                )}
              </div>

              <div className="flex justify-between gap-3 pt-6 mt-2 border-t border-border-subtle">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this event?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  className="text-red-400 hover:text-red-500 hover:bg-red-400/10 text-[14px] px-4"
                  disabled={deleteMutation.isPending}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>

                <div className="flex gap-2">
                  {canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="gap-2 border-border-strong text-[14px] px-4"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  <Button
                    className="bg-bg-highlight border border-border-strong text-text-primary hover:bg-bg-overlay text-[14px] px-6"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
