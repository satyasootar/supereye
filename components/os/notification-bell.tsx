'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

export function NotificationBell({ 
  align = 'end', 
  side = 'bottom' 
}: { 
  align?: 'start' | 'center' | 'end'; 
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
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
      <PopoverContent 
        className="w-[360px] p-0 bg-bg-surface border border-border-subtle shadow-2xl rounded-2xl overflow-hidden" 
        align={align} 
        side={side}
        sideOffset={12}
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle bg-bg-surface">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setOpen(false)}
              className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-bg-highlight transition-colors"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
            <h4 className="text-[15px] font-semibold text-text-primary font-heading">Notifications</h4>
          </div>
          {unreadCount > 0 && (
            <button 
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              onClick={() => markAsReadMutation.mutate(undefined)}
              disabled={markAsReadMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
              Mark as read
            </button>
          )}
        </div>
        
        <div className="max-h-[380px] overflow-y-auto custom-scrollbar bg-bg-surface">
          {isLoading ? (
            <div className="p-8 text-center text-[13px] text-text-muted font-medium">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-text-muted font-medium">No new notifications.</div>
          ) : (
            <div className="flex flex-col">
              <AnimatePresence initial={false}>
                {notifications.map((notif, index) => (
                  <motion.div 
                    key={notif.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`px-4 py-4 border-b border-border-subtle/50 transition-colors hover:bg-bg-highlight flex gap-3 cursor-pointer group`}
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
                  {/* Unread indicator */}
                  <div className="flex-shrink-0 pt-1.5 w-3">
                    {!notif.isRead ? (
                      <div className="h-[7px] w-[7px] bg-accent-blue rounded-full" />
                    ) : (
                      <div className="h-[7px] w-[7px] rounded-full" /> /* Placeholder to keep alignment */
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 space-y-1.5">
                    <p className={`text-[13.5px] leading-[1.4] text-text-primary ${!notif.isRead ? 'font-medium' : ''}`}>
                      {notif.title}
                    </p>
                    
                    <p className="text-[11.5px] text-text-muted font-medium">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>

                    {/* Status badges - conditionally rendered if body is formatted like a status update */}
                    {notif.body && notif.body.includes('->') && (
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue text-[11px] font-semibold">
                          <div className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
                          {notif.body.split('->')[0].trim()}
                        </div>
                        <span className="text-text-muted text-[10px]">→</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] font-semibold">
                          <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          {notif.body.split('->')[1].trim()}
                        </div>
                      </div>
                    )}
                    
                    {/* Normal body if it's not a status update */}
                    {notif.body && !notif.body.includes('->') && (
                      <p className="text-[12.5px] text-text-secondary line-clamp-1 pt-0.5">
                        {notif.body}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
