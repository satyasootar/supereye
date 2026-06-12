'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useAppStore } from '@/lib/store/app-store';

type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { openTab, setSelectedEmailId } = useAppStore();

  const { data, isLoading } = useQuery<{ notifications: Notification[] }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=10');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    refetchInterval: 60000, // Fallback if SSE misses something
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id?: string) => {
      const payload = id ? { id } : { markAll: true };
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to mark read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-text-subtle" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full bg-red-500 text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-2 bg-popover border-border shadow-lg" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-background rounded-t-md">
          <h4 className="text-sm font-semibold text-text">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-primary h-auto py-1 px-2"
              onClick={() => markAsReadMutation.mutate(undefined)}
              disabled={markAsReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="max-h-[500px] bg-background">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-text-subtle">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-text-subtle">No notifications yet.</div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3.5 border-b border-border-subtle/50 transition-colors hover:bg-secondary flex gap-3 cursor-pointer ${
                    !notif.isRead ? 'bg-accent' : 'bg-background'
                  }`}
                  onClick={() => {
                    if (!notif.isRead) markAsReadMutation.mutate(notif.id);
                    if (notif.link?.startsWith('/emails/')) {
                      const emailId = notif.link.split('/emails/')[1];
                      openTab('email');
                      setSelectedEmailId(emailId);
                      setOpen(false);
                    }
                  }}
                >
                  <div className="flex-1 space-y-1">
                    <p className={`text-[13.5px] leading-snug line-clamp-2 ${!notif.isRead ? 'font-semibold text-text' : 'text-text-subtle'}`}>
                      {notif.title}
                    </p>
                    {notif.body && (
                      <p className="text-[12px] text-text-subtle line-clamp-1">
                        {notif.body}
                      </p>
                    )}
                    <p className="text-[10px] text-text-subtle/70 pt-0.5 font-medium">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="flex items-center flex-shrink-0 pt-1">
                      <div className="h-2 w-2 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
