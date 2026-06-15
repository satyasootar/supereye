'use client';

import React, { useState, useMemo } from 'react';
import {
  Inbox, FileText, Send, Archive, Trash2, Edit,
  Flame, Clock, Mail, Search, Tag, SlidersHorizontal,
  ChevronDown, ChevronLeft, ChevronRight, Calendar,
  X, Reply, Forward, ChevronsRight, MoreHorizontal,
  Star, Users,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

interface MockEmail {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  body: string;
  time: string;
  date: string; // group header
  isRead: boolean;
  isStarred: boolean;
  priority?: 'urgent' | null;
}

const MOCK_EMAILS: MockEmail[] = [
  {
    id: '1', sender: 'Coca-Cola', subject: '✨ A Sip of Magic, Made for You',
    snippet: 'Feeling hot? Tired? Just bored? If this ema...',
    body: 'Hi there,\n\nFeeling hot? Tired? Just bored? If this email found you, it\'s because the universe thinks you deserve a little sparkle today.\n\nIntroducing our new limited edition Summer Breeze collection — crafted to make every sip feel like a vacation.\n\n🧊 Ice-cold refreshment\n✨ Zero sugar, maximum vibes\n🎁 Order now and get free shipping\n\nDon\'t let summer pass you by. Grab yours before they\'re gone!\n\nCheers,\nThe Coca-Cola Team',
    time: '12:36 PM', date: 'Today', isRead: false, isStarred: false, priority: null,
  },
  {
    id: '2', sender: 'Adobe for Photographers', subject: 'The selfie tool that puts your s...',
    snippet: 'Go from cluttered to clear. Bring attention ...',
    body: 'Hey Creator,\n\nThe selfie tool that puts your skills on autopilot is here.\n\nGo from cluttered to clear. Bring attention to what matters with our new AI-powered background removal and enhancement tools.\n\n• One-click background swap\n• AI skin smoothing (natural look)\n• Batch process hundreds of photos\n\nTry it free for 7 days.\n\nBest,\nAdobe Creative Team',
    time: '11:24 AM', date: 'Today', isRead: false, isStarred: false, priority: null,
  },
  {
    id: '3', sender: 'Google tips and updates', subject: 'SATYA, get the ultimate match...',
    snippet: 'Catch highlights on YouTube, decode rule...',
    body: 'Hi Satya,\n\nGet the ultimate match experience with YouTube Premium!\n\nCatch highlights on YouTube, decode rule changes, and never miss a moment of the action.\n\nHere\'s what\'s trending:\n• Top 10 plays of the week\n• Behind-the-scenes training footage\n• Live commentary and analysis\n\nUpgrade to Premium for ad-free streaming.\n\nGoogle Tips Team',
    time: '9:29 AM', date: 'Today', isRead: true, isStarred: false, priority: null,
  },
  {
    id: '4', sender: 'Sahil Kumar Panda', subject: 'I want to connect',
    snippet: 'Sahil Kumar, Sales Coordinator from Nab Bharat Enterpris...',
    body: 'Hi Satya,\n\nI hope this message finds you well. My name is Sahil Kumar and I\'m a Sales Coordinator at Nab Bharat Enterprises.\n\nI came across your profile and was really impressed by your work in software development. I\'d love to connect and explore potential collaboration opportunities.\n\nWould you be available for a quick 15-minute call this week?\n\nBest regards,\nSahil Kumar Panda\nSales Coordinator, Nab Bharat Enterprises',
    time: '8:48 AM', date: 'Today', isRead: true, isStarred: false, priority: null,
  },
  {
    id: '5', sender: 'daily.dev', subject: 'SATYA, your personal update f...',
    snippet: "Here&#39;s what developers in your topic...",
    body: 'Hey Satya 👋\n\nHere\'s your personal developer update!\n\nTrending in your topics:\n\n1. "Why I switched from VS Code to Cursor" - 2.4k upvotes\n2. "Building AI agents with LangChain" - 1.8k upvotes\n3. "Next.js 16 - Everything you need to know" - 3.1k upvotes\n\nYour weekly reading stats:\n📚 12 articles read\n⏱️ 45 min reading time\n🔥 5-day streak!\n\nKeep it up!\ndaily.dev team',
    time: '8:30 AM', date: 'Today', isRead: true, isStarred: false, priority: null,
  },
  {
    id: '6', sender: 'InsForge', subject: 'Your InsForge Project "terminal...',
    snippet: 'Insforge Hi there, To optimize cloud resou...',
    body: 'Hi there,\n\nTo optimize cloud resource usage for your InsForge project "terminal-app", we\'ve identified some recommendations:\n\n⚡ Performance: Your API response times have improved by 23% this week\n💰 Cost: You could save $12/month by downsizing your staging instance\n🔒 Security: 2 dependencies need updating\n\nLog in to your dashboard to review these suggestions.\n\nBest,\nInsForge Team',
    time: '8:19 AM', date: 'Today', isRead: true, isStarred: false, priority: null,
  },
  {
    id: '7', sender: 'Medium Daily Digest', subject: 'Kubernetes is Officially Doome...',
    snippet: 'Satya Sootar Stories for Satya Sootar @sa...',
    body: 'Your Daily Digest\n\n📰 Top Stories for You:\n\n1. Kubernetes is Officially Doomed — Here\'s What\'s Replacing It\nBy Sarah Chen · 8 min read · 4.2K claps\n\n2. I Built a SaaS in 48 Hours Using AI — Here\'s What Happened\nBy Marcus Wright · 6 min read · 2.1K claps\n\n3. The Death of REST APIs: Why GraphQL Won\nBy Alex Thompson · 5 min read · 1.8K claps\n\nHappy reading!\nMedium Team',
    time: '7:10 AM', date: 'Today', isRead: true, isStarred: false, priority: null,
  },
  {
    id: '8', sender: 'Amazon.in', subject: 'We found something you migh...',
    snippet: 'How about another look? Keep shopping ...',
    body: 'Hi Satya,\n\nWe noticed you were looking at some items. Here are some picks you might like:\n\n🎧 Sony WH-1000XM5 — ₹24,990 (20% off)\n⌨️ Keychron K2 Mechanical Keyboard — ₹7,999\n📱 Samsung Galaxy S24 Ultra Case — ₹1,299\n\nFree delivery on orders over ₹499!\n\nHappy shopping,\nAmazon.in',
    time: '5:41 AM', date: 'Today', isRead: true, isStarred: false, priority: null,
  },
  {
    id: '9', sender: 'Google', subject: 'You shared some Google Acco...',
    snippet: 'Keep track of your Google Account data s...',
    body: 'Hi Satya,\n\nYou recently shared some of your Google Account data with a third-party app. Here\'s a summary:\n\nApp: Supereye\nData shared: Gmail (read-only), Calendar\nDate: Jun 15, 2026\n\nYou can review and manage your connected apps at any time in your Google Account settings.\n\nStay secure,\nGoogle Accounts Team',
    time: '2:52 AM', date: 'Today', isRead: true, isStarred: false, priority: null,
  },
  {
    id: '10', sender: 'Isha Nagpal via LinkedIn', subject: 'Isha accepted your invitation, ...',
    snippet: "See Isha Nagpal&#39;s connections, exp...",
    body: 'Isha Nagpal accepted your invitation!\n\nYou and Isha are now connected on LinkedIn.\n\nIsha Nagpal\nSoftware Engineer at Microsoft\nBangalore, India\n\n500+ connections\n\nSend Isha a message to start a conversation.',
    time: '2:48 AM', date: 'Today', isRead: true, isStarred: false, priority: null,
  },
  {
    id: '11', sender: 'Google', subject: 'You shared some Google Acco...',
    snippet: 'Keep track of your Google Account data s...',
    body: 'Security notification: Your Google Account data was recently accessed.\n\nPlease review your activity if this wasn\'t you.\n\nGoogle Security Team',
    time: '1:32 AM', date: 'Today', isRead: true, isStarred: false, priority: null,
  },
  {
    id: '12', sender: 'Satya Prangya Sootar', subject: 'Invitation: Code @ Mon 15 Jun ...',
    snippet: 'Code Join with Google Meet – You have been i...',
    body: 'You have been invited to the following event:\n\nCode\nWhen: Mon 15 Jun 2026, 02:15 AM\nWhere: Google Meet\n\nJoin with Google Meet: meet.google.com/abc-defg-hij\n\nInvited by: Satya Prangya Sootar',
    time: '1:26 AM', date: 'Today', isRead: true, isStarred: false, priority: null,
  },
  {
    id: '13', sender: 'Prashant Kumar Gouda', subject: 'I want to connect',
    snippet: 'Prashant Kumar, Software Developer from Secuodsoft Te...',
    body: 'Hi Satya,\n\nI\'m Prashant Kumar, a Software Developer at Secuodsoft Technologies. I\'d love to connect with you regarding potential collaboration opportunities.\n\nLooking forward to hearing from you!\n\nBest,\nPrashant Kumar Gouda',
    time: '12:48 AM', date: 'Today', isRead: true, isStarred: false, priority: null,
  },
  {
    id: '14', sender: 'GitHub', subject: '[satyasootar] A security advis...',
    snippet: '1 repository in your GitHub account might ...',
    body: '⚠️ Security Advisory\n\n1 repository in your GitHub account might be affected by a recently published security vulnerability.\n\nRepository: satyasootar/supereye\nPackage: next\nSeverity: Moderate\n\nWe recommend updating to the latest version.\n\nGitHub Security',
    time: '12:36 AM', date: 'Today', isRead: true, isStarred: false, priority: null,
  },
  {
    id: '15', sender: 'SATYA SOOTAR', subject: 'Test Mail',
    snippet: 'Hi, This is a test mail. Regards, SATYA',
    body: 'Hi,\n\nThis is a test mail.\n\nRegards,\nSATYA',
    time: 'Jun 14', date: 'Yesterday', isRead: true, isStarred: false, priority: null,
  },
];

const SIDEBAR_NAV = [
  { icon: Inbox, label: 'Inbox', count: 92, active: true },
  { icon: FileText, label: 'Drafts', count: 0, active: false },
  { icon: Send, label: 'Sent', count: 0, active: false },
  { icon: Archive, label: 'Archive', count: 0, active: false },
  { icon: Trash2, label: 'Trash', count: 0, active: false },
];

const TRIAGE_NAV = [
  { icon: Inbox, label: 'All mail', count: 0, filter: 'all' },
  { icon: Flame, label: 'Urgent', count: 10, filter: 'urgent' },
  { icon: Clock, label: 'Can wait', count: 82, filter: 'can_wait' },
];

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Mail', count: 93 },
  { id: 'PRIMARY', label: 'Primary', count: 92 },
  { id: 'PROMOTIONS', label: 'Promotions', count: 17 },
  { id: 'SOCIAL', label: 'Social', count: 5 },
  { id: 'UPDATES', label: 'Updates', count: 69 },
];

const UPCOMING_EVENTS = [
  { title: 'Code', date: 'Today, 02:15', color: 'bg-accent-blue' },
];

/* ------------------------------------------------------------------ */
/*  Mini Calendar Generator                                            */
/* ------------------------------------------------------------------ */

function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();
  const dates: Date[] = [];
  const startDate = new Date(year, month, 1 - startDayOfWeek);
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MockDashboard() {
  const [selectedEmail, setSelectedEmail] = useState<MockEmail | null>(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeSidebarItem, setActiveSidebarItem] = useState('Inbox');
  const [activeTriageFilter, setActiveTriageFilter] = useState('all');
  const [calMonth, setCalMonth] = useState(5); // June = 5 (0-indexed)
  const [calYear, setCalYear] = useState(2026);

  const calDays = useMemo(() => generateCalendarDays(calYear, calMonth), [calYear, calMonth]);
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const today = new Date();
  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const isCurrentMonth = (d: Date) => d.getMonth() === calMonth && d.getFullYear() === calYear;

  const prevMonth = () => {
    setCalMonth((m) => {
      if (m === 0) { setCalYear((y) => y - 1); return 11; }
      return m - 1;
    });
  };
  const nextMonth = () => {
    setCalMonth((m) => {
      if (m === 11) { setCalYear((y) => y + 1); return 0; }
      return m + 1;
    });
  };

  // Group emails by date header
  const emailGroups = useMemo(() => {
    const groups: { title: string; emails: MockEmail[] }[] = [];
    const map = new Map<string, MockEmail[]>();
    MOCK_EMAILS.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    });
    map.forEach((emails, title) => groups.push({ title, emails }));
    return groups;
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden rounded-b-[var(--radius-lg)]" style={{ fontSize: '13px' }}>
      {/* ── Left Sidebar ── */}
      <div className="flex h-full w-[220px] flex-shrink-0 flex-col border-r border-border-subtle bg-bg-surface overflow-hidden">
        {/* Workspace Switcher */}
        <div className="flex-shrink-0 px-3 py-2.5 border-b border-border-subtle">
          <div className="flex items-center justify-between gap-2 rounded-md border border-border-subtle bg-bg-highlight/60 px-2.5 py-2 cursor-pointer hover:bg-bg-highlight transition-colors">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-text-primary">Gmail + Calendar</p>
              <p className="truncate text-[9px] text-text-muted">Gmail · Calendar</p>
            </div>
            <ChevronDown className="h-3 w-3 shrink-0 text-text-muted" />
          </div>
        </div>

        {/* Email label */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle flex-shrink-0">
          <Mail className="h-3.5 w-3.5 text-accent-blue" />
          <span className="text-[12px] font-semibold text-text-primary">Email</span>
        </div>

        {/* Compose */}
        <div className="px-3 py-2 flex-shrink-0">
          <button className="flex w-full h-9 items-center justify-center gap-2 rounded-md bg-accent-blue text-[12px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity">
            <Edit className="h-3.5 w-3.5" />
            Compose
          </button>
        </div>

        {/* Nav Items */}
        <nav className="mt-1 flex flex-col gap-0.5 px-2 flex-shrink-0">
          {SIDEBAR_NAV.map((item) => {
            const isActive = activeSidebarItem === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setActiveSidebarItem(item.label)}
                className={`flex items-center justify-between rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  isActive
                    ? 'bg-bg-highlight text-text-primary border-l-2 border-accent-blue rounded-l-none'
                    : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                {item.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? 'bg-accent-blue text-white' : 'text-text-muted'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* AI Triage */}
        <div className="mt-3 px-2 flex-shrink-0">
          <div className="flex items-center px-3 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              AI Triage
            </span>
          </div>
          <div className="mt-0.5 flex flex-col gap-0.5">
            {TRIAGE_NAV.map((item) => {
              const isActive = activeTriageFilter === item.filter;
              return (
                <button
                  key={item.filter}
                  onClick={() => setActiveTriageFilter(item.filter)}
                  className={`flex items-center justify-between rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    isActive
                      ? 'bg-bg-highlight text-text-primary border-l-2 border-accent-blue rounded-l-none'
                      : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                  {item.count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      item.filter === 'urgent' ? 'text-[color:var(--priority-urgent,#ef4444)]' : 'text-text-muted'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1" />
      </div>

      {/* ── Email List (Center) ── */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-bg-app">
        {/* Header */}
        <div className="flex h-[48px] flex-shrink-0 items-center justify-between px-4 border-b border-border-subtle bg-bg-app">
          <div className="flex items-center gap-2 text-text-primary">
            <Archive className="h-4 w-4 text-accent-blue" />
            <h1 className="text-[15px] font-semibold">All Mail</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-default bg-bg-surface w-[180px]">
              <Search className="h-3 w-3 text-text-muted" />
              <span className="text-[11px] text-text-muted">Search emails...</span>
            </div>
            {/* Filter buttons */}
            <button className="flex items-center gap-1 px-2 py-1 rounded-full border border-border-default bg-bg-surface text-[11px] font-medium text-text-secondary hover:bg-bg-highlight transition-colors">
              <Users className="h-3 w-3" />
              Senders
            </button>
            <button className="flex items-center gap-1 px-2 py-1 rounded-full border border-border-default bg-bg-surface text-[11px] font-medium text-text-secondary hover:bg-bg-highlight transition-colors">
              <Tag className="h-3 w-3" />
              Labels
            </button>
            <button className="flex items-center gap-1 px-2 py-1 rounded-full border border-border-default bg-bg-surface text-[11px] font-medium text-text-secondary hover:bg-bg-highlight transition-colors">
              <SlidersHorizontal className="h-3 w-3" />
              Quick Filters
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex-none px-3 py-1.5 border-b border-border-subtle bg-bg-surface/50 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === tab.id
                    ? 'bg-accent-blue/10 text-accent-blue'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                }`}
              >
                {tab.label}
                <span className={`px-1 py-0.5 rounded-full text-[9px] leading-none font-bold ${
                  activeCategory === tab.id
                    ? 'bg-accent-blue text-white'
                    : 'bg-border-subtle text-text-secondary'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Email List */}
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-2">
          <div className="flex flex-col w-full">
            {emailGroups.map((group) => (
              <div key={group.title} className="mb-2">
                <div className="px-2 py-1.5 text-[12px] font-semibold text-text-primary sticky top-0 bg-bg-app z-10 opacity-90">
                  {group.title}
                </div>
                <div className="flex flex-col w-full">
                  {group.emails.map((email) => {
                    const isSelected = selectedEmail?.id === email.id;
                    return (
                      <div
                        key={email.id}
                        onClick={() => setSelectedEmail(email)}
                        className={`group relative flex items-center gap-2 px-2 py-[6px] border-l-2 transition-colors cursor-pointer rounded-r-md ${
                          isSelected
                            ? 'bg-bg-highlight border-accent-blue text-text-primary'
                            : 'border-transparent text-text-secondary hover:bg-bg-overlay'
                        } ${!email.isRead && !isSelected ? 'bg-bg-surface/40' : ''}`}
                      >
                        {/* Sender */}
                        <div className="flex items-center flex-shrink-0 w-[140px]">
                          <span className={`truncate text-[12px] ${
                            !email.isRead ? 'font-semibold text-text-primary' : 'text-text-muted font-normal'
                          }`}>
                            {email.sender}
                          </span>
                        </div>

                        {/* Subject + Snippet */}
                        <div className="flex-1 flex items-center overflow-hidden gap-1.5 min-w-0">
                          {email.priority === 'urgent' && (
                            <span className="flex-shrink-0 px-1 py-0.5 rounded text-[8px] font-bold bg-red-500/15 text-red-400">
                              ⚡
                            </span>
                          )}
                          <span className={`truncate text-[12px] flex-shrink-0 max-w-[35%] ${
                            !email.isRead ? 'font-semibold text-text-primary' : 'text-text-muted font-normal'
                          }`}>
                            {email.subject}
                          </span>
                          <span className="truncate text-[12px] text-text-muted opacity-70 min-w-0">
                            {email.snippet}
                          </span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center justify-end flex-shrink-0 w-[65px]">
                          <span className="text-[11px] font-medium text-text-muted">
                            {email.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Calendar or Email Reader ── */}
      <div className="flex h-full w-[220px] flex-shrink-0 flex-col border-l border-border-subtle bg-bg-surface overflow-hidden transition-all duration-300">
        {selectedEmail ? (
          /* ── Email Reader Panel ── */
          <div className="flex h-full flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
            {/* Reader Header */}
            <div className="flex-shrink-0 border-b border-border-subtle bg-bg-base px-3 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors"
                    title="Close"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-0.5 text-text-secondary">
                  <button className="p-1 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="Archive">
                    <Archive className="h-3 w-3" />
                  </button>
                  <button className="p-1 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <button className="p-1 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors" title="More">
                    <MoreHorizontal className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <h2 className="text-[13px] font-semibold text-text-primary leading-tight">
                {selectedEmail.subject}
              </h2>
            </div>

            {/* Sender info */}
            <div className="flex-shrink-0 px-3 py-2 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-semibold text-text-primary">{selectedEmail.sender}</span>
                  <span className="text-[10px] text-text-secondary">To: me</span>
                </div>
                <span className="text-[10px] text-text-secondary font-medium">{selectedEmail.time}</span>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3">
              <div className="text-[11.5px] leading-[1.65] text-text-primary whitespace-pre-wrap">
                {selectedEmail.body}
              </div>
            </div>

            {/* Reply / Forward */}
            <div className="flex-shrink-0 px-3 py-2 border-t border-border-subtle flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-accent-blue/30 text-accent-blue text-[11px] hover:bg-bg-highlight/50 hover:border-accent-blue/60 transition-colors bg-bg-app cursor-pointer font-medium">
                <Reply className="h-3 w-3" />
                Reply
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-accent-blue/30 text-accent-blue text-[11px] hover:bg-bg-highlight/50 hover:border-accent-blue/60 transition-colors bg-bg-app cursor-pointer font-medium">
                <Forward className="h-3 w-3" />
                Forward
              </button>
            </div>
          </div>
        ) : (
          /* ── Calendar Sidebar ── */
          <div className="flex h-full flex-col overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-text-muted" />
                <span className="text-[12px] font-semibold text-text-primary">Calendar</span>
              </div>
              <span className="text-[10px] font-medium text-accent-blue cursor-pointer hover:underline">Focus</span>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between px-3 pt-3 pb-1 flex-shrink-0">
              <span className="text-[12px] font-semibold text-text-primary">{monthLabel}</span>
              <div className="flex items-center gap-0.5">
                <button onClick={prevMonth} className="p-0.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button onClick={nextMonth} className="p-0.5 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Mini Calendar Grid */}
            <div className="px-3 pb-3 border-b border-border-subtle flex-shrink-0">
              <div className="grid grid-cols-7 gap-y-0.5 text-center mb-0.5">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-[9px] font-mono text-text-muted py-0.5">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5 text-center">
                {calDays.map((dateObj, i) => {
                  const isTodayDate = isToday(dateObj);
                  const isCurrMonth = isCurrentMonth(dateObj);
                  return (
                    <div
                      key={i}
                      className={`flex h-6 w-full items-center justify-center text-[10px] cursor-pointer transition-colors select-none rounded-full ${
                        isCurrMonth ? 'text-text-primary' : 'text-text-muted/30'
                      } hover:bg-bg-overlay`}
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        isTodayDate
                          ? 'bg-accent-blue text-white font-bold shadow-sm'
                          : ''
                      }`}>
                        {dateObj.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming */}
            <div className="mt-3 px-2 flex-1">
              <div className="flex items-center gap-1 px-2 mb-2">
                <ChevronDown className="h-3 w-3 text-text-muted" />
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                  Upcoming
                </span>
              </div>
              <div className="flex flex-col gap-1.5 px-1">
                {UPCOMING_EVENTS.map((evt, i) => (
                  <div key={i} className="group flex gap-2 rounded-lg p-1.5 hover:bg-bg-overlay cursor-pointer transition-colors">
                    <div className="mt-1 flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-blue" />
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-[11px] font-medium text-text-primary group-hover:text-accent-blue transition-colors">
                        {evt.title}
                      </span>
                      <span className="truncate text-[10px] text-text-secondary">
                        {evt.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
