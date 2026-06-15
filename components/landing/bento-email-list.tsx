'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const EMAILS = [
  {
    sender: 'Coca-Cola',
    subject: 'A Sip of Magic, Made for You',
    snippet: 'Feeling hot? Tired? Just bored?',
    time: '12:36 PM',
    unread: true,
  },
  {
    sender: 'Adobe for Photographers',
    subject: 'The selfie tool that puts your skills on autopilot',
    snippet: 'Go from cluttered to clear.',
    time: '11:24 AM',
    unread: true,
  },
  {
    sender: 'Google tips and updates',
    subject: 'Get the ultimate match experience',
    snippet: 'Catch highlights on YouTube.',
    time: '9:29 AM',
    unread: false,
  },
  {
    sender: 'GitHub',
    subject: 'Security advisory for supereye',
    snippet: '1 repository might be affected.',
    time: '12:36 AM',
    unread: true,
  },
  {
    sender: 'daily.dev',
    subject: 'Your personal developer update',
    snippet: 'Trending in your topics.',
    time: '8:30 AM',
    unread: false,
  },
  {
    sender: 'Sahil Kumar Panda',
    subject: 'I want to connect',
    snippet: 'Sales Coordinator from Nab Bharat.',
    time: '8:48 AM',
    unread: false,
  },
  {
    sender: 'Vercel',
    subject: '▲ Deployment Succeeded',
    snippet: 'Project: supereye-landing-page',
    time: '7:42 AM',
    unread: false,
  },
  {
    sender: 'Stripe',
    subject: 'Payment of $120.00 received',
    snippet: 'Customer: John Doe (Premium Plan)',
    time: '6:15 AM',
    unread: true,
  },
  {
    sender: 'Linear',
    subject: 'New issue: Fix scrollbar styling',
    snippet: 'Assigned to you by Sarah',
    time: 'Yesterday',
    unread: false,
  },
  {
    sender: 'Slack',
    subject: 'New message in #general',
    snippet: 'Sarah Chen: Let\'s sync up',
    time: 'Yesterday',
    unread: true,
  },
  {
    sender: 'Figma',
    subject: 'Comments in "Supereye v2.0"',
    snippet: 'Alex commented on Hero design',
    time: 'Yesterday',
    unread: false,
  },
  {
    sender: 'Google Calendar',
    subject: 'Upcoming Event: Project Sync',
    snippet: 'In 15 minutes (02:15 AM)',
    time: 'Yesterday',
    unread: true,
  },
  {
    sender: 'Notion',
    subject: 'Notion Workspace Update',
    snippet: 'Stripe integration notes updated',
    time: 'Jun 13',
    unread: false,
  },
  {
    sender: 'Airbnb',
    subject: 'Reservation confirmed - Goa',
    snippet: 'Your stay at Casa de Goa is ready',
    time: 'Jun 12',
    unread: false,
  },
];

export function BentoEmailList() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 1) % EMAILS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const visible = [
    EMAILS[offset % EMAILS.length],
    EMAILS[(offset + 1) % EMAILS.length],
    EMAILS[(offset + 2) % EMAILS.length],
    EMAILS[(offset + 3) % EMAILS.length],
    EMAILS[(offset + 4) % EMAILS.length],
    EMAILS[(offset + 5) % EMAILS.length],
    EMAILS[(offset + 6) % EMAILS.length],
    EMAILS[(offset + 7) % EMAILS.length],
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Mini inbox header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-bg-surface/80 px-3 py-2 backdrop-blur-sm">
        <span className="text-[11px] font-semibold text-text-primary">All Mail</span>
        <span className="rounded-full bg-accent-blue/15 px-1.5 py-0.5 text-[9px] font-bold text-accent-blue">
          92
        </span>
      </div>

      {/* Animated email rows */}
      <div className="relative min-h-0 flex-1 overflow-hidden px-2 py-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((email, i) => (
            <motion.div
              key={`${email.sender}-${offset}-${i}`}
              layout
              initial={{ opacity: 0, y: -28, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 28, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'mb-1 flex items-center gap-2 rounded-lg px-2 py-2',
                'border border-transparent',
                email.unread ? 'bg-bg-highlight/60' : 'bg-bg-app/50',
                i === 0 && 'border-accent-blue/20'
              )}
            >
              <div className="w-[72px] shrink-0 truncate text-[10px] font-medium text-text-primary">
                {email.sender}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-[10px]',
                    email.unread
                      ? 'font-semibold text-text-primary'
                      : 'text-text-muted'
                  )}
                >
                  {email.subject}
                </p>
                <p className="truncate text-[9px] text-text-muted opacity-70">
                  {email.snippet}
                </p>
              </div>
              <span className="shrink-0 text-[9px] text-text-muted">{email.time}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
