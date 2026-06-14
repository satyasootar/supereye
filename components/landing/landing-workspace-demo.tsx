'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  FileText,
  Send,
  Archive,
  Trash2,
  Edit,
  Mail,
  Calendar,
  PanelLeftClose,
  Search,
  Sparkles,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Bot,
  Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DemoView = 'email' | 'calendar' | 'agent';
type EmailFolder = 'ALL' | 'DRAFT' | 'SENT' | 'ARCHIVE' | 'TRASH';
type TriageFilter = 'all' | 'urgent' | 'can-wait';

const MOCK_EMAILS = [
  {
    id: '1',
    sender: 'Sarah Chen',
    subject: 'Q2 roadmap review',
    snippet: 'Can we sync on priorities before Friday standup?',
    time: '10:42 AM',
    unread: true,
    priority: 'urgent' as const,
  },
  {
    id: '2',
    sender: 'GitHub',
    subject: 'PR #142 needs your review',
    snippet: 'satya requested changes on supereye keyboard engine.',
    time: '9:15 AM',
    unread: true,
    priority: 'urgent' as const,
  },
  {
    id: '3',
    sender: 'Google Calendar',
    subject: 'Team sync tomorrow at 2 PM',
    snippet: 'Weekly sync. No conflicts on your calendar.',
    time: 'Yesterday',
    unread: false,
    priority: 'can-wait' as const,
  },
  {
    id: '4',
    sender: 'Stripe',
    subject: 'Your invoice is ready',
    snippet: 'March billing summary for your workspace.',
    time: '2 days ago',
    unread: false,
    priority: 'can-wait' as const,
  },
];

const CALENDAR_EVENTS = [
  { time: '9:00 AM', title: 'Inbox triage', color: 'bg-accent-blue/20 text-accent-blue' },
  { time: '11:30 AM', title: 'Design review', color: 'bg-bg-highlight text-text-primary' },
  { time: '2:00 PM', title: 'Team sync', color: 'bg-accent-blue/30 text-accent-blue-dim' },
  { time: '4:30 PM', title: 'Ship keyboard shortcuts', color: 'bg-bg-overlay text-text-secondary' },
];

const AGENT_STEPS = [
  { label: 'Read thread', status: 'done' },
  { label: 'Matched intent: schedule reply', status: 'done' },
  { label: 'Drafting reply', status: 'active' },
  { label: 'Awaiting confirmation', status: 'pending' },
];

const FOLDERS: { id: EmailFolder; label: string; icon: typeof Inbox }[] = [
  { id: 'ALL', label: 'Inbox', icon: Inbox },
  { id: 'DRAFT', label: 'Drafts', icon: FileText },
  { id: 'SENT', label: 'Sent', icon: Send },
  { id: 'ARCHIVE', label: 'Archive', icon: Archive },
  { id: 'TRASH', label: 'Trash', icon: Trash2 },
];

function PriorityDot({ tier }: { tier: 'urgent' | 'can-wait' }) {
  return (
    <span
      className={cn(
        'h-2 w-2 rounded-full',
        tier === 'urgent' ? 'bg-priority-urgent' : 'bg-priority-medium'
      )}
    />
  );
}

function EmailSidebarDemo({
  view,
  setView,
  folder,
  setFolder,
  triage,
  setTriage,
}: {
  view: DemoView;
  setView: (v: DemoView) => void;
  folder: EmailFolder;
  setFolder: (f: EmailFolder) => void;
  triage: TriageFilter;
  setTriage: (t: TriageFilter) => void;
}) {
  return (
    <div className="flex h-full w-[200px] flex-shrink-0 flex-col border-r border-border-subtle bg-bg-surface">
      <div className="flex h-11 items-center justify-between border-b border-border-subtle px-3">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-accent-blue" />
          <span className="text-[13px] font-semibold text-text-primary">Email</span>
        </div>
        <button type="button" className="rounded p-1 text-text-muted hover:bg-bg-overlay">
          <PanelLeftClose className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-3 py-2">
        <button
          type="button"
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-accent-blue text-[12px] font-semibold text-text-inverse shadow-sm"
        >
          <Edit className="h-3.5 w-3.5" />
          Compose
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        {FOLDERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setView('email');
              setFolder(item.id);
            }}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors',
              view === 'email' && folder === item.id
                ? 'border-l-2 border-accent-blue bg-bg-highlight text-text-primary'
                : 'border-l-2 border-transparent text-text-secondary hover:bg-bg-overlay'
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
            {item.id === 'ALL' && (
              <span className="ml-auto rounded-full bg-accent-blue px-1.5 text-[10px] font-bold text-text-inverse">
                2
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-3 px-2">
        <span className="px-2.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          AI Triage
        </span>
        <div className="mt-1 flex flex-col gap-0.5">
          {(
            [
              { id: 'all' as const, label: 'All mail', count: null },
              { id: 'urgent' as const, label: 'Urgent', count: 2 },
              { id: 'can-wait' as const, label: 'Can wait', count: 2 },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setView('email');
                setTriage(item.id);
              }}
              className={cn(
                'flex items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                view === 'email' && triage === item.id
                  ? 'border-l-2 border-accent-blue bg-bg-highlight text-text-primary'
                  : 'border-l-2 border-transparent text-text-secondary hover:bg-bg-overlay'
              )}
            >
              <span>{item.label}</span>
              {item.count != null && (
                <span className="text-[10px] text-text-muted">{item.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-border-subtle p-2">
        <button
          type="button"
          onClick={() => setView('calendar')}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-colors',
            view === 'calendar'
              ? 'bg-bg-highlight text-accent-blue'
              : 'text-text-secondary hover:bg-bg-overlay'
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          Switch to Calendar
        </button>
        <button
          type="button"
          onClick={() => setView('agent')}
          className={cn(
            'mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-colors',
            view === 'agent'
              ? 'bg-bg-highlight text-accent-blue'
              : 'text-text-secondary hover:bg-bg-overlay'
          )}
        >
          <Bot className="h-3.5 w-3.5" />
          Open Agent
        </button>
      </div>
    </div>
  );
}

function EmailListDemo({
  selectedId,
  setSelectedId,
  triage,
}: {
  selectedId: string;
  setSelectedId: (id: string) => void;
  triage: TriageFilter;
}) {
  const filtered = MOCK_EMAILS.filter((e) => {
    if (triage === 'urgent') return e.priority === 'urgent';
    if (triage === 'can-wait') return e.priority === 'can-wait';
    return true;
  });

  return (
    <div className="flex h-full w-[280px] flex-shrink-0 flex-col border-r border-border-subtle bg-bg-app">
      <div className="flex h-11 items-center justify-between border-b border-border-subtle px-3">
        <div className="flex items-center gap-1.5">
          {['All Mail', 'Primary', 'Updates'].map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                i === 0
                  ? 'bg-bg-highlight text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <Search className="h-3.5 w-3.5 text-text-muted" />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filtered.map((email) => (
          <button
            key={email.id}
            type="button"
            onClick={() => setSelectedId(email.id)}
            className={cn(
              'flex w-full flex-col gap-1 border-b border-border-subtle px-3 py-2.5 text-left transition-colors',
              selectedId === email.id
                ? 'bg-bg-highlight/80'
                : 'hover:bg-bg-surface/80'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  'truncate text-[12px]',
                  email.unread ? 'font-semibold text-text-primary' : 'text-text-secondary'
                )}
              >
                {email.sender}
              </span>
              <span className="flex-shrink-0 text-[10px] text-text-muted">{email.time}</span>
            </div>
            <span className="truncate text-[11px] font-medium text-text-primary">
              {email.subject}
            </span>
            <div className="flex items-center gap-2">
              <PriorityDot tier={email.priority} />
              <span className="truncate text-[10px] text-text-muted">{email.snippet}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmailReaderDemo({ emailId }: { emailId: string }) {
  const email = MOCK_EMAILS.find((e) => e.id === emailId) ?? MOCK_EMAILS[0];

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-bg-base">
      <div className="border-b border-border-subtle px-4 py-3">
        <h3 className="text-[14px] font-semibold text-text-primary">{email.subject}</h3>
        <p className="mt-0.5 text-[11px] text-text-muted">
          From: {email.sender} &lt;{email.sender.toLowerCase().replace(' ', '.')}@company.com&gt;
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 text-[12px] leading-relaxed text-text-secondary">
        <p>Hi,</p>
        <p className="mt-2">{email.snippet}</p>
        <p className="mt-2">
          Let me know if you want to block time on the calendar. supereye can draft a reply
          and suggest slots from your Google Calendar.
        </p>
        <p className="mt-2">Best, {email.sender.split(' ')[0]}</p>
      </div>
      <div className="border-t border-border-subtle bg-bg-highlight/40 p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-blue">
          <Sparkles className="h-3.5 w-3.5" />
          AI Summary
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
          {email.priority === 'urgent'
            ? 'Marked urgent. Reply recommended before end of day. No calendar conflicts for a 30 min sync.'
            : 'Low urgency. Safe to batch with other updates. Invoice can be reviewed later.'}
        </p>
      </div>
    </div>
  );
}

function CalendarDemo() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'];

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-bg-app">
      <div className="flex h-11 items-center justify-between border-b border-border-subtle px-4">
        <div className="flex items-center gap-2">
          <button type="button" className="rounded p-1 hover:bg-bg-overlay">
            <ChevronLeft className="h-4 w-4 text-text-muted" />
          </button>
          <span className="text-[13px] font-semibold text-text-primary">June 2026</span>
          <button type="button" className="rounded p-1 hover:bg-bg-overlay">
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-accent-blue/10 px-2.5 py-1 text-[11px] font-semibold text-accent-blue"
        >
          <Plus className="h-3 w-3" />
          New event
        </button>
      </div>

      <div className="grid flex-1 grid-cols-[48px_1fr] overflow-hidden">
        <div className="border-r border-border-subtle pt-10">
          {hours.map((h) => (
            <div key={h} className="h-14 border-b border-border-subtle/50 px-1 text-[9px] text-text-muted">
              {h}
            </div>
          ))}
        </div>
        <div className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border-subtle">
            {days.map((d, i) => (
              <div
                key={d}
                className={cn(
                  'py-2 text-center text-[10px] font-medium',
                  i === 0 ? 'text-accent-blue' : 'text-text-muted'
                )}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="relative">
            {CALENDAR_EVENTS.map((ev, i) => (
              <div
                key={ev.title}
                className={cn(
                  'absolute left-[14%] right-[30%] rounded-md px-2 py-1 text-[10px] font-medium landing-float-sm',
                  ev.color
                )}
                style={{ top: `${i * 56 + 8}px`, height: '44px' }}
              >
                <div className="font-semibold">{ev.title}</div>
                <div className="opacity-70">{ev.time}</div>
              </div>
            ))}
            {hours.map((h) => (
              <div key={h} className="h-14 border-b border-border-subtle/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentDemo() {
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-bg-app p-4">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border-subtle bg-bg-elevated p-4 landing-float-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-blue/15">
            <Bot className="h-4 w-4 text-accent-blue" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-text-primary">supereye agent</p>
            <p className="text-[11px] text-text-muted">Running workflow on PR #142</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {AGENT_STEPS.map((step) => (
            <div
              key={step.label}
              className="flex items-center gap-2.5 rounded-lg bg-bg-surface px-3 py-2"
            >
              {step.status === 'done' && (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              )}
              {step.status === 'active' && (
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-accent-blue" />
              )}
              {step.status === 'pending' && (
                <Clock className="h-3.5 w-3.5 text-text-muted" />
              )}
              <span
                className={cn(
                  'text-[12px]',
                  step.status === 'active' ? 'font-medium text-text-primary' : 'text-text-secondary'
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-border-subtle bg-bg-highlight/50 p-3">
          <p className="text-[11px] font-medium text-text-primary">Draft ready</p>
          <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
            &quot;Thanks for the review. I pushed fixes for the keyboard handler. Ready for
            another look when you have a moment.&quot;
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-accent-blue px-3 py-1.5 text-[11px] font-semibold text-text-inverse"
            >
              Send reply
            </button>
            <button
              type="button"
              className="rounded-lg border border-border-default px-3 py-1.5 text-[11px] font-medium text-text-secondary"
            >
              Edit draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingWorkspaceDemo() {
  const [view, setView] = useState<DemoView>('email');
  const [folder, setFolder] = useState<EmailFolder>('ALL');
  const [triage, setTriage] = useState<TriageFilter>('all');
  const [selectedId, setSelectedId] = useState('1');

  return (
    <section id="workspace" className="scroll-mt-24 px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="landing-tag-glow inline-flex rounded-full bg-bg-elevated px-3 py-1 text-[11px] font-semibold text-accent-blue-dim">
              Live preview
            </span>
            <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
              Click around. This is your workspace.
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-text-secondary">
            Switch folders, triage mail, open the calendar, or run the agent. Every control
            is interactive.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-elevated landing-float">
          {/* Window chrome */}
          <div className="flex items-center justify-between border-b border-border-subtle bg-bg-surface px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-priority-urgent/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-priority-medium/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
            </div>
            <span className="rounded-md bg-bg-app px-3 py-0.5 font-mono text-[10px] text-text-muted">
              supereye.app/workspace
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
              <Keyboard className="h-3 w-3" />
              <span>Press D for theme</span>
            </div>
          </div>

          {/* Workspace tabs */}
          <div className="flex items-center gap-1 border-b border-border-subtle bg-bg-surface/80 px-3 py-1.5">
            {(
              [
                { id: 'email' as const, label: 'Gmail + Calendar', active: view !== 'agent' },
                { id: 'agent' as const, label: 'Agent', active: view === 'agent' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setView(tab.id === 'agent' ? 'agent' : 'email')}
                className={cn(
                  'rounded-md px-3 py-1 text-[12px] font-medium transition-colors',
                  tab.active
                    ? 'bg-bg-highlight text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                )}
              >
                {tab.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-bg-overlay">
                <Image
                  src="/Icons/gmail.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="object-contain"
                />
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-bg-overlay">
                <Image
                  src="/Icons/google-calendar.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Main workspace area */}
          <div className="flex h-[420px] md:h-[480px]">
            <EmailSidebarDemo
              view={view}
              setView={setView}
              folder={folder}
              setFolder={setFolder}
              triage={triage}
              setTriage={setTriage}
            />

            <AnimatePresence mode="wait">
              {view === 'email' && (
                <motion.div
                  key="email-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex min-w-0 flex-1"
                >
                  <EmailListDemo
                    selectedId={selectedId}
                    setSelectedId={setSelectedId}
                    triage={triage}
                  />
                  <EmailReaderDemo emailId={selectedId} />
                </motion.div>
              )}

              {view === 'calendar' && (
                <motion.div
                  key="calendar-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex min-w-0 flex-1"
                >
                  <CalendarDemo />
                </motion.div>
              )}

              {view === 'agent' && (
                <motion.div
                  key="agent-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex min-w-0 flex-1"
                >
                  <AgentDemo />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
