'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Calendar as CalendarIcon, Clock, MapPin, Users, Trash } from 'lucide-react';
import { useState } from 'react';

export function EventDetailsModal({ eventId, open, onOpenChange }: { eventId: string | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', 'events', eventId],
    queryFn: async () => {
      const res = await fetch(`/api/calendar/events/${eventId}`);
      if (!res.ok) throw new Error('Failed to fetch event details');
      return res.json();
    },
    enabled: !!eventId && open
  });

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
    }
  });

  const evt = data?.event;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-bg-surface border-border-strong text-text-primary p-0 overflow-hidden">
        <DialogTitle className="sr-only">Event Details</DialogTitle>
        {isLoading || !evt ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
          </div>
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
                      {evt.start?.dateTime 
                        ? new Date(evt.start.dateTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) 
                        : evt.start?.date 
                          ? new Date(evt.start.date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                          : ''}
                    </span>
                    <span className="text-[14px] text-text-muted">
                      to {evt.end?.dateTime 
                        ? new Date(evt.end.dateTime).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }) 
                        : evt.end?.date 
                          ? new Date(evt.end.date).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                          : ''}
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
                        {evt.attendees.map((a: any, i: number) => (
                          <div key={i} className="flex items-center gap-2.5 text-[13px] bg-bg-overlay/50 px-2 py-1.5 rounded-md">
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
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-border-subtle">
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
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Event'}
                </Button>
                <Button 
                  className="bg-bg-highlight border border-border-strong text-text-primary hover:bg-bg-overlay text-[14px] px-6" 
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
