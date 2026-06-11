'use client';

import { useQuery } from '@tanstack/react-query';
import { Mail } from 'lucide-react';

interface InboxMessage {
  id: string;
  snippet?: string;
  subject?: string;
  sender?: string;
}

export function InboxPanel() {
  const { data, isLoading, error } = useQuery<{ messages: InboxMessage[] }>({
    queryKey: ['mail-threads'],
    queryFn: async () => {
      const res = await fetch('/api/mail/threads');
      if (!res.ok) throw new Error('Failed to fetch emails');
      return res.json();
    },
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-muted/50" />
        <div className="flex flex-col gap-4 mt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2 rounded-2xl border border-border/50 p-4">
              <div className="h-5 w-3/4 rounded bg-muted/50" />
              <div className="h-4 w-1/2 rounded bg-muted/50" />
            </div>
          ))}
        </div>
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

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Recent Emails</h2>
          <p className="text-sm text-muted-foreground">
            Your latest updates
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <Mail className="h-5 w-5" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {messagesList.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Mail className="h-8 w-8 opacity-20" />
            <p className="text-sm">Inbox is clear!</p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messagesList.map((msg) => {
              const id = msg.id;
              const snippet = msg.snippet || "New message received";
              const subject = msg.subject || "Message";
              const sender = msg.sender || "Sender";

              return (
                <div key={id} className="group flex flex-col gap-2 rounded-2xl border border-border/50 p-4 transition-all hover:border-border hover:shadow-md bg-card">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-medium leading-none text-foreground/90 truncate">
                      {subject}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 truncate">
                      <span className="font-medium">{sender}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {snippet}
                    </p>
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
