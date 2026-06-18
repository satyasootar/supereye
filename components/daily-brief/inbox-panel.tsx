import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Star, Archive, CheckCircle2, Circle, Link as LinkIcon } from 'lucide-react';
import { EmailThread } from './email-thread';
import { EmailFetchPatienceNotice } from '@/components/os/email-fetch-patience-notice';
import { cn } from '@/lib/utils';
import { useSlowLoadingNotice } from '@/lib/hooks/use-slow-loading-notice';

export interface InboxMessage {
  id: string;
  snippet?: string;
  subject?: string;
  sender?: string;
  isRead?: boolean;
  isStarred?: boolean;
  isLinkedToEvent?: boolean;
}

interface InboxPanelProps {
  openEmailId: string | null;
  setOpenEmailId: (id: string | null) => void;
}

export function InboxPanel({ openEmailId, setOpenEmailId }: InboxPanelProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{ messages: InboxMessage[] }>({
    queryKey: ['mail-threads'],
    queryFn: async () => {
      const res = await fetch('/api/mail/threads');
      if (!res.ok) throw new Error('Failed to fetch emails');
      return res.json();
    },
    refetchInterval: 1000 * 60 * 5,
  });

  const starMutation = useMutation({
    mutationFn: async ({ id, isStarred }: { id: string, isStarred: boolean }) => {
      await fetch(`/api/mail/${id}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred })
      });
    },
    onMutate: async ({ id, isStarred }) => {
      await queryClient.cancelQueries({ queryKey: ['mail-threads'] });
      const previous = queryClient.getQueryData(['mail-threads']);
      queryClient.setQueryData(['mail-threads'], (old: any) => ({
        ...old,
        messages: old.messages.map((m: InboxMessage) => m.id === id ? { ...m, isStarred } : m)
      }));
      return { previous };
    },
    onError: (err, variables, context: any) => {
      if (context?.previous) queryClient.setQueryData(['mail-threads'], context.previous);
    }
  });

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/mail/${id}/read`, { method: 'POST' });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['mail-threads'] });
      const previous = queryClient.getQueryData(['mail-threads']);
      queryClient.setQueryData(['mail-threads'], (old: any) => ({
        ...old,
        messages: old.messages.map((m: InboxMessage) => m.id === id ? { ...m, isRead: true } : m)
      }));
      return { previous };
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/mail/${id}/archive`, { method: 'POST' });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['mail-threads'] });
      const previous = queryClient.getQueryData(['mail-threads']);
      queryClient.setQueryData(['mail-threads'], (old: any) => ({
        ...old,
        messages: old.messages.filter((m: InboxMessage) => m.id !== id)
      }));
      return { previous };
    }
  });

  const showSlowFetchNotice = useSlowLoadingNotice(isLoading);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col p-6">
        {showSlowFetchNotice ? (
          <EmailFetchPatienceNotice className="mt-12" />
        ) : (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-8 w-48 rounded-lg bg-muted/50" />
            <div className="mt-4 flex flex-col gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-2 rounded-2xl border border-border/50 p-4">
                  <div className="h-5 w-3/4 rounded bg-muted/50" />
                  <div className="h-4 w-1/2 rounded bg-muted/50" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-red-500">
        <div className="flex flex-col items-center gap-2">
          <Mail className="h-8 w-8 opacity-50" />
          <p className="text-sm font-medium">Failed to load inbox</p>
        </div>
      </div>
    );
  }

  const messagesList = data?.messages || [];
  const selectedEmailData = messagesList.find(m => m.id === openEmailId);

  return (
    <div className="flex h-full flex-col p-6 relative overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Recent Emails</h2>
          <p className="text-sm text-muted-foreground">
            Your prioritized updates
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {messagesList.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            <p className="text-sm font-medium">Inbox Zero!</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {messagesList.map((msg, idx) => {
              const id = msg.id;
              const snippet = msg.snippet || "New message received";
              const subject = msg.subject || "No Subject";
              const sender = msg.sender || "Unknown Sender";
              const isRead = msg.isRead;
              const isStarred = msg.isStarred;

              return (
                <article 
                  key={id} 
                  onClick={() => {
                    setOpenEmailId(id);
                    if (!isRead) readMutation.mutate(id);
                  }}
                  className={cn(
                    "group relative flex flex-col gap-1.5 p-4 transition-all cursor-pointer border-b border-border/40 hover:bg-white/5 active:scale-[0.99]",
                    !isRead && "bg-primary/5"
                  )}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {!isRead && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
                      <h3 className={cn("text-base truncate pr-4", isRead ? "font-normal text-foreground/70" : "font-semibold text-foreground")}>
                        {subject}
                      </h3>
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 bg-background/80 backdrop-blur-md rounded-lg p-1 shadow-sm">
                      <button 
                        onClick={(e) => { e.stopPropagation(); archiveMutation.mutate(id); }}
                        className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); starMutation.mutate({ id, isStarred: !isStarred }); }}
                        className={cn("p-2 hover:bg-muted rounded-md transition-colors", isStarred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500")}
                        title={isStarred ? "Unstar" : "Star"}
                      >
                        <Star className="h-4 w-4" fill={isStarred ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                  
                  <div className={cn("flex items-center gap-3 text-sm truncate", isRead ? "text-muted-foreground/80" : "text-foreground/90 font-medium")}>
                    <span>{sender}</span>
                    {msg.isLinkedToEvent && (
                      <span className="flex items-center gap-1 text-primary bg-primary/10 px-1.5 py-0.5 rounded-md text-xs font-semibold">
                        <LinkIcon className="h-3 w-3" /> Scheduled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 pr-8 leading-relaxed">
                    {snippet}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedEmailData && (
        <EmailThread
          emailId={selectedEmailData.id}
          subject={selectedEmailData.subject || ''}
          sender={selectedEmailData.sender || ''}
          snippet={selectedEmailData.snippet || ''}
          onClose={() => setOpenEmailId(null)}
        />
      )}
    </div>
  );
}
