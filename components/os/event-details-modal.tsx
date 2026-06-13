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
        {isLoading || !evt ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
          </div>
        ) : (
          <>
            <div className="h-16 bg-accent-blue/10 border-b border-border-subtle" />
            <div className="p-6 pt-4 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">{evt.summary}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-text-secondary">
                  <Clock className="h-5 w-5 mt-0.5 text-text-muted" />
                  <div className="flex flex-col">
                    <span className="text-[14px]">
                      {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString() : evt.start?.date}
                    </span>
                    <span className="text-[14px] text-text-muted">
                      to {evt.end?.dateTime ? new Date(evt.end.dateTime).toLocaleString() : evt.end?.date}
                    </span>
                  </div>
                </div>

                {evt.location && (
                  <div className="flex items-start gap-3 text-text-secondary">
                    <MapPin className="h-5 w-5 mt-0.5 text-text-muted" />
                    <span className="text-[14px]">{evt.location}</span>
                  </div>
                )}

                {evt.attendees && evt.attendees.length > 0 && (
                  <div className="flex items-start gap-3 text-text-secondary">
                    <Users className="h-5 w-5 mt-0.5 text-text-muted" />
                    <div className="flex flex-col gap-1 w-full">
                      <span className="text-[14px] font-medium">{evt.attendees.length} guests</span>
                      <div className="max-h-24 overflow-y-auto custom-scrollbar flex flex-col gap-1 mt-1">
                        {evt.attendees.map((a: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-[13px]">
                            <div className="h-2 w-2 rounded-full bg-border-strong" />
                            <span className="truncate">{a.email}</span>
                            <span className="text-text-muted text-[11px] ml-auto bg-bg-overlay px-1.5 rounded">{a.responseStatus}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {evt.description && (
                  <div className="pt-4 border-t border-border-subtle">
                    <div className="text-[13px] text-text-secondary whitespace-pre-wrap">
                      {evt.description}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border-subtle">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this event?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  disabled={deleteMutation.isPending}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
                <Button className="bg-accent-blue text-white hover:bg-accent-blue/90" onClick={() => onOpenChange(false)}>
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
