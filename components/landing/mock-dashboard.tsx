'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Inbox, FileText, Send, Archive, Trash2, Edit,
  Flame, Clock, Mail, Search, Tag,
  ChevronDown, ChevronLeft, ChevronRight, Calendar,
  Reply, Forward, ChevronsRight, MoreHorizontal,
  Star, Users, ArrowLeftRight, PanelRightClose, PanelRightOpen,
  GitPullRequest, HardDrive, LayoutDashboard, FolderGit2,
  RefreshCw, Plus, FolderOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PluginBrandIcon } from '@/components/onboarding/plugin-brand-icon';
import type { PluginId } from '@/lib/plugins/types';

/* ------------------------------------------------------------------ */
/*  Types & Mock Data                                                  */
/* ------------------------------------------------------------------ */

interface MockEmail {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  body: string;
  time: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  triage: 'urgent' | 'can_wait' | null;
  category: 'PRIMARY' | 'PROMOTIONS' | 'SOCIAL' | 'UPDATES';
}

interface MockWorkspace {
  id: string;
  name?: string;
  primary: PluginId;
  sidebar: PluginId;
}

interface MockEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  color: string;
  day: number;
}

interface MockPR {
  id: string;
  title: string;
  repo: string;
  author: string;
  status: 'open' | 'merged';
  updated: string;
}

interface MockFile {
  id: string;
  name: string;
  type: string;
  modified: string;
  icon: string;
}

const MOCK_WORKSPACES: MockWorkspace[] = [
  { id: 'ws-1', primary: 'email', sidebar: 'calendar' },
  { id: 'ws-2', name: 'Dev Flow', primary: 'github', sidebar: 'email' },
  { id: 'ws-3', primary: 'calendar', sidebar: 'drive' },
];

const MOCK_EMAILS: MockEmail[] = [
  {
    id: '1', sender: 'Coca-Cola', subject: '✨ A Sip of Magic, Made for You',
    snippet: 'Feeling hot? Tired? Just bored? If this ema...',
    body: 'Hi there,\n\nFeeling hot? Tired? Just bored? If this email found you, it\'s because the universe thinks you deserve a little sparkle today.\n\nIntroducing our new limited edition Summer Breeze collection — crafted to make every sip feel like a vacation.\n\n🧊 Ice-cold refreshment\n✨ Zero sugar, maximum vibes\n🎁 Order now and get free shipping\n\nCheers,\nThe Coca-Cola Team',
    time: '12:36 PM', date: 'Today', isRead: false, isStarred: false, triage: 'can_wait', category: 'PROMOTIONS',
  },
  {
    id: '2', sender: 'Adobe for Photographers', subject: 'The selfie tool that puts your s...',
    snippet: 'Go from cluttered to clear. Bring attention ...',
    body: 'Hey Creator,\n\nThe selfie tool that puts your skills on autopilot is here.\n\nGo from cluttered to clear. Bring attention to what matters with our new AI-powered background removal and enhancement tools.\n\nTry it free for 7 days.\n\nBest,\nAdobe Creative Team',
    time: '11:24 AM', date: 'Today', isRead: false, isStarred: true, triage: 'urgent', category: 'PROMOTIONS',
  },
  {
    id: '3', sender: 'Google tips and updates', subject: 'SATYA, get the ultimate match...',
    snippet: 'Catch highlights on YouTube, decode rule...',
    body: 'Hi Satya,\n\nGet the ultimate match experience with YouTube Premium!\n\nCatch highlights on YouTube, decode rule changes, and never miss a moment of the action.\n\nGoogle Tips Team',
    time: '9:29 AM', date: 'Today', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
  {
    id: '4', sender: 'Sahil Kumar Panda', subject: 'I want to connect',
    snippet: 'Sahil Kumar, Sales Coordinator from Nab Bharat Enterpris...',
    body: 'Hi Satya,\n\nI hope this message finds you well. My name is Sahil Kumar and I\'m a Sales Coordinator at Nab Bharat Enterprises.\n\nWould you be available for a quick 15-minute call this week?\n\nBest regards,\nSahil Kumar Panda',
    time: '8:48 AM', date: 'Today', isRead: true, isStarred: false, triage: 'urgent', category: 'SOCIAL',
  },
  {
    id: '5', sender: 'daily.dev', subject: 'SATYA, your personal update f...',
    snippet: "Here's what developers in your topic...",
    body: 'Hey Satya 👋\n\nHere\'s your personal developer update!\n\n1. "Why I switched from VS Code to Cursor" - 2.4k upvotes\n2. "Building AI agents with LangChain" - 1.8k upvotes\n3. "Next.js 16 - Everything you need to know" - 3.1k upvotes\n\ndaily.dev team',
    time: '8:30 AM', date: 'Today', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
  {
    id: '6', sender: 'InsForge', subject: 'Your InsForge Project "terminal...',
    snippet: 'Insforge Hi there, To optimize cloud resou...',
    body: 'Hi there,\n\nTo optimize cloud resource usage for your InsForge project "terminal-app", we\'ve identified some recommendations:\n\n⚡ Performance: API response times improved by 23%\n💰 Cost: Save $12/month by downsizing staging\n\nInsForge Team',
    time: '8:19 AM', date: 'Today', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
  {
    id: '7', sender: 'Medium Daily Digest', subject: 'Kubernetes is Officially Doome...',
    snippet: 'Satya Sootar Stories for Satya Sootar @sa...',
    body: 'Your Daily Digest\n\n📰 Top Stories for You:\n\n1. Kubernetes is Officially Doomed\n2. I Built a SaaS in 48 Hours Using AI\n3. The Death of REST APIs\n\nMedium Team',
    time: '7:10 AM', date: 'Today', isRead: true, isStarred: false, triage: 'can_wait', category: 'PRIMARY',
  },
  {
    id: '8', sender: 'Amazon.in', subject: 'We found something you migh...',
    snippet: 'How about another look? Keep shopping ...',
    body: 'Hi Satya,\n\n🎧 Sony WH-1000XM5 — ₹24,990 (20% off)\n⌨️ Keychron K2 — ₹7,999\n📱 Samsung Galaxy S24 Ultra Case — ₹1,299\n\nAmazon.in',
    time: '5:41 AM', date: 'Today', isRead: true, isStarred: false, triage: 'can_wait', category: 'PROMOTIONS',
  },
  {
    id: '9', sender: 'GitHub', subject: '[satyasootar] A security advis...',
    snippet: '1 repository in your GitHub account might ...',
    body: '⚠️ Security Advisory\n\nRepository: satyasootar/supereye\nPackage: next\nSeverity: Moderate\n\nGitHub Security',
    time: '12:36 AM', date: 'Today', isRead: false, isStarred: false, triage: 'urgent', category: 'UPDATES',
  },
  {
    id: '10', sender: 'SATYA SOOTAR', subject: 'Test Mail',
    snippet: 'Hi, This is a test mail. Regards, SATYA',
    body: 'Hi,\n\nThis is a test mail.\n\nRegards,\nSATYA',
    time: 'Jun 14', date: 'Yesterday', isRead: true, isStarred: false, triage: null, category: 'PRIMARY',
  },
  {
    id: '11', sender: 'Google', subject: 'You shared some Google Acco...',
    snippet: 'Keep track of your Google Account data s...',
    body: 'Hi Satya,\n\nYou recently shared some of your Google Account data with a third-party app.\n\nApp: Supereye\nData shared: Gmail (read-only), Calendar\n\nGoogle Accounts Team',
    time: '2:52 AM', date: 'Today', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
  {
    id: '12', sender: 'Isha Nagpal via LinkedIn', subject: 'Isha accepted your invitation, ...',
    snippet: "See Isha Nagpal's connections, exp...",
    body: 'Isha Nagpal accepted your invitation!\n\nYou and Isha are now connected on LinkedIn.\n\nIsha Nagpal\nSoftware Engineer at Microsoft\nBangalore, India\n\nSend Isha a message to start a conversation.',
    time: '2:48 AM', date: 'Today', isRead: true, isStarred: false, triage: 'can_wait', category: 'SOCIAL',
  },
  {
    id: '13', sender: 'Satya Prangya Sootar', subject: 'Invitation: Code @ Mon 15 Jun ...',
    snippet: 'Code Join with Google Meet – You have been i...',
    body: 'You have been invited to the following event:\n\nCode\nWhen: Mon 15 Jun 2026, 02:15 AM\nWhere: Google Meet\n\nJoin with Google Meet: meet.google.com/abc-defg-hij',
    time: '1:26 AM', date: 'Today', isRead: true, isStarred: true, triage: 'urgent', category: 'PRIMARY',
  },
  {
    id: '14', sender: 'Prashant Kumar Gouda', subject: 'I want to connect',
    snippet: 'Prashant Kumar, Software Developer from Secuodsoft Te...',
    body: 'Hi Satya,\n\nI\'m Prashant Kumar, a Software Developer at Secuodsoft Technologies. I\'d love to connect with you regarding potential collaboration opportunities.\n\nBest,\nPrashant Kumar Gouda',
    time: '12:48 AM', date: 'Today', isRead: true, isStarred: false, triage: 'can_wait', category: 'SOCIAL',
  },
  {
    id: '15', sender: 'Vercel', subject: 'Deployment succeeded for supereye',
    snippet: 'Your deployment to production is live. View ...',
    body: 'Hi Satya,\n\nYour deployment to production is now live.\n\nProject: supereye\nBranch: main\nCommit: feat: landing dashboard polish\n\nView deployment → vercel.app/supereye\n\nVercel',
    time: '11:58 PM', date: 'Yesterday', isRead: false, isStarred: false, triage: 'urgent', category: 'UPDATES',
  },
  {
    id: '16', sender: 'Stripe', subject: 'Payment of $120.00 received',
    snippet: 'Customer: John Doe (Premium Plan). View ...',
    body: 'A payment of $120.00 was successfully processed.\n\nCustomer: John Doe\nPlan: Premium (monthly)\nInvoice: INV-2026-0614\n\nView in Stripe Dashboard →\n\nStripe',
    time: '9:14 PM', date: 'Yesterday', isRead: true, isStarred: false, triage: 'can_wait', category: 'PRIMARY',
  },
  {
    id: '17', sender: 'Notion', subject: 'Mentioned you in "Supereye v2.0"',
    snippet: 'Alex commented on Hero design section...',
    body: 'Alex Thompson mentioned you in Supereye v2.0:\n\n"@satya Can we align the hero CTA with the new brand colors before launch?"\n\nReply in Notion →\n\nNotion Team',
    time: '6:42 PM', date: 'Yesterday', isRead: false, isStarred: false, triage: 'urgent', category: 'PRIMARY',
  },
  {
    id: '18', sender: 'Swiggy', subject: '50% off your next order 🍕',
    snippet: 'Hungry? Your exclusive weekend offer is ...',
    body: 'Hey Satya,\n\nYour weekend treat is here! Get 50% off up to ₹120 on your next order.\n\nUse code: WEEKEND50\nValid till: Jun 16, 2026\n\nOrder now on Swiggy',
    time: '4:20 PM', date: 'Yesterday', isRead: true, isStarred: false, triage: 'can_wait', category: 'PROMOTIONS',
  },
  {
    id: '19', sender: 'Linear', subject: 'SUP-142 assigned to you',
    snippet: 'Fix scrollbar styling in email list panel...',
    body: 'SUP-142 has been assigned to you.\n\nTitle: Fix scrollbar styling in email list panel\nPriority: Medium\nProject: Supereye · Sprint 4\n\nOpen in Linear →',
    time: '3:05 PM', date: 'Yesterday', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
  {
    id: '20', sender: 'Figma', subject: 'Comments in "Supereye Dashboard"',
    snippet: 'Sarah Chen left 3 new comments on ...',
    body: 'Sarah Chen left new comments on Supereye Dashboard:\n\n• "Love the workspace switcher — can we add plugin icons?"\n• "Calendar sidebar feels tight at 320px"\n• "Approved for dev handoff ✅"\n\nOpen in Figma →',
    time: '1:18 PM', date: 'Yesterday', isRead: true, isStarred: true, triage: 'can_wait', category: 'PRIMARY',
  },
  {
    id: '21', sender: 'Twitter', subject: 'You have 4 new notifications',
    snippet: '@devsatya, @cursor_ai and others interac...',
    body: 'You have new notifications:\n\n• @cursor_ai liked your post about AI agents\n• @shadcn reposted your UI thread\n• 2 new followers this week\n\nSee all on X →',
    time: '11:30 AM', date: 'Yesterday', isRead: true, isStarred: false, triage: 'can_wait', category: 'SOCIAL',
  },
  {
    id: '22', sender: 'Coursera', subject: 'Your course deadline is tomorrow',
    snippet: 'Machine Learning Specialization — Week 3 ...',
    body: 'Hi Satya,\n\nReminder: Your assignment for Machine Learning Specialization (Week 3) is due tomorrow.\n\nCourse progress: 68% complete\n\nContinue learning →\n\nCoursera',
    time: '8:00 AM', date: 'Yesterday', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
  {
    id: '23', sender: 'MakeMyTrip', subject: 'Reservation confirmed — Goa',
    snippet: 'Your stay at Casa de Goa is ready. Check-...',
    body: 'Booking confirmed!\n\nHotel: Casa de Goa, Calangute\nCheck-in: Jul 4, 2026 · 2:00 PM\nCheck-out: Jul 7, 2026 · 11:00 AM\nBooking ID: MMT-8847291\n\nView itinerary →\n\nMakeMyTrip',
    time: 'Jun 13', date: 'Yesterday', isRead: true, isStarred: true, triage: null, category: 'PRIMARY',
  },
  {
    id: '24', sender: 'Spotify', subject: 'Your Discover Weekly is ready',
    snippet: '30 new songs picked just for you this w...',
    body: 'Your Discover Weekly playlist is ready.\n\nFeaturing artists similar to Khruangbin, Fred again.., and The Blaze.\n\nListen now on Spotify →',
    time: 'Jun 13', date: 'Yesterday', isRead: true, isStarred: false, triage: 'can_wait', category: 'PROMOTIONS',
  },
  {
    id: '25', sender: 'Hacker News', subject: 'Top stories: Show HN edition',
    snippet: 'Show HN: I built a unified inbox in a weeken...',
    body: 'Top Show HN posts today:\n\n1. Show HN: I built a unified inbox in a weekend\n2. Show HN: Open-source Linear alternative\n3. Ask HN: Best tools for solo founders in 2026?\n\nRead on Hacker News →',
    time: 'Jun 12', date: 'Mon, Jun 23', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
  {
    id: '26', sender: 'Anthropic', subject: 'Claude API usage summary — May',
    snippet: 'Your May 2026 usage report is ready. Tota...',
    body: 'Hi Satya,\n\nYour May 2026 Claude API usage summary:\n\nTotal tokens: 2.4M\nEstimated cost: $18.42\nTop model: claude-sonnet-4\n\nView full report →\n\nAnthropic',
    time: 'Jun 12', date: 'Mon, Jun 23', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
  {
    id: '27', sender: 'Razorpay', subject: 'Payout of ₹45,000 processed',
    snippet: 'Your settlement for Jun 1–15 has been ...',
    body: 'Your payout of ₹45,000.00 has been processed to account ending 4821.\n\nSettlement period: Jun 1 – Jun 15, 2026\nUTR: RAZP20260612001\n\nView settlement →\n\nRazorpay',
    time: 'Jun 12', date: 'Mon, Jun 23', isRead: true, isStarred: false, triage: 'can_wait', category: 'PRIMARY',
  },
  {
    id: '28', sender: 'Discord', subject: 'New message in #general',
    snippet: "Sarah Chen: Let's sync up on the hackathon...",
    body: "Sarah Chen in #general:\n\n\"Let's sync up on the hackathon demo at 4 PM today. I'll share the Figma link in the thread.\"\n\nReply in Discord →",
    time: 'Jun 11', date: 'Mon, Jun 23', isRead: false, isStarred: false, triage: 'urgent', category: 'SOCIAL',
  },
  {
    id: '29', sender: 'OpenAI', subject: 'Your API key was used in a new location',
    snippet: 'We noticed API activity from Bangalore, I...',
    body: 'Security notice:\n\nYour API key ending in ...7f2a was used from a new location (Bangalore, IN) at Jun 11, 2026 10:22 UTC.\n\nIf this was you, no action is needed.\n\nOpenAI Security',
    time: 'Jun 11', date: 'Mon, Jun 23', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
  {
    id: '30', sender: 'Product Hunt', subject: '🚀 Supereye is trending #3 today',
    snippet: 'Congratulations! Your launch is gaining ...',
    body: 'Congratulations Satya!\n\nSupereye is currently #3 Product of the Day on Product Hunt.\n\n🔺 142 upvotes\n💬 38 comments\n\nKeep the momentum going — reply to comments!\n\nProduct Hunt',
    time: 'Jun 11', date: 'Mon, Jun 23', isRead: false, isStarred: true, triage: 'urgent', category: 'PRIMARY',
  },
  {
    id: '31', sender: 'Netflix', subject: 'New arrivals you might like',
    snippet: 'Squid Game S3, The Bear S4, and more ...',
    body: 'Hi Satya,\n\nNew this week on Netflix:\n\n🎬 Squid Game — Season 3\n🍳 The Bear — Season 4\n🚀 Interstellar (now in 4K)\n\nWatch now →\n\nNetflix',
    time: 'Jun 10', date: 'Mon, Jun 23', isRead: true, isStarred: false, triage: 'can_wait', category: 'PROMOTIONS',
  },
  {
    id: '32', sender: 'Slack', subject: 'Reminder: Team retro in 30 minutes',
    snippet: 'Supereye · #engineering — Sprint 4 retro...',
    body: 'Reminder from Supereye workspace:\n\nTeam retro starts in 30 minutes.\nWhen: Today, 4:00 PM IST\nWhere: Google Meet\n\nJoin meeting →\n\nSlack',
    time: 'Jun 10', date: 'Mon, Jun 23', isRead: true, isStarred: false, triage: 'can_wait', category: 'PRIMARY',
  },
  {
    id: '33', sender: 'Canva', subject: 'Your design "Pitch Deck v3" was viewed',
    snippet: '3 people viewed your design in the last 24...',
    body: 'Your design Pitch Deck v3 was viewed 3 times in the last 24 hours.\n\nViewers: sarah@company.com, alex@startup.io\n\nOpen in Canva →\n\nCanva',
    time: 'Jun 9', date: 'Last week', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
  {
    id: '34', sender: 'Uber', subject: 'Your ride receipt — ₹287',
    snippet: 'Thanks for riding with Uber. Trip on Jun 9...',
    body: 'Trip summary:\n\nFrom: Koramangala 5th Block\nTo: Bangalore Airport T1\nFare: ₹287.00\nPayment: UPI ·••• 4821\n\nDownload receipt →\n\nUber India',
    time: 'Jun 9', date: 'Last week', isRead: true, isStarred: false, triage: null, category: 'UPDATES',
  },
  {
    id: '35', sender: 'Replit', subject: 'Your Repl "ai-agent-demo" is sleeping',
    snippet: 'Wake it up or upgrade to keep it always ...',
    body: 'Your Repl ai-agent-demo has gone to sleep due to inactivity.\n\nWake it up with one click, or upgrade to Replit Core for always-on hosting.\n\nOpen Repl →\n\nReplit',
    time: 'Jun 8', date: 'Last week', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
  {
    id: '36', sender: 'Zerodha', subject: 'Contract note — EQ trades Jun 8',
    snippet: 'Your contract note for trades executed on...',
    body: 'Your contract note for Jun 8, 2026 is available.\n\nTrades: 2\nNet amount: ₹12,450.00\n\nDownload PDF from Console →\n\nZerodha',
    time: 'Jun 8', date: 'Last week', isRead: true, isStarred: false, triage: 'can_wait', category: 'PRIMARY',
  },
  {
    id: '37', sender: 'Flipkart', subject: 'Order delivered: Keychron K2',
    snippet: 'Your order has been delivered. Rate your ...',
    body: 'Your order has been delivered!\n\nKeychron K2 Mechanical Keyboard\nDelivered on Jun 8, 2026 at 3:42 PM\n\nRate your experience →\n\nFlipkart',
    time: 'Jun 8', date: 'Last week', isRead: true, isStarred: false, triage: 'can_wait', category: 'PROMOTIONS',
  },
  {
    id: '38', sender: 'Cal.com', subject: 'New booking: Intro call with investor',
    snippet: 'Alex Morgan booked 30 min on Jun 12 at ...',
    body: 'New booking confirmed:\n\nEvent: Intro call with investor\nGuest: Alex Morgan (Sequoia Scout)\nWhen: Jun 12, 2026 · 11:00 AM IST\n\nView booking →\n\nCal.com',
    time: 'Jun 7', date: 'Last week', isRead: false, isStarred: false, triage: 'urgent', category: 'PRIMARY',
  },
  {
    id: '39', sender: 'Substack', subject: 'New post from Pragmatic Engineer',
    snippet: 'How Cursor builds AI-native developer t...',
    body: 'New post from Pragmatic Engineer:\n\n"How Cursor builds AI-native developer tools"\n\nA deep dive into IDE architecture, agent loops, and shipping fast.\n\nRead on Substack →',
    time: 'Jun 7', date: 'Last week', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
  {
    id: '40', sender: 'Apple', subject: 'Your receipt from Apple',
    snippet: 'iCloud+ 200GB — ₹219/month. Manage sub...',
    body: 'Receipt from Apple.\n\niCloud+ 200GB\n₹219.00 / month\nRenewal date: Jul 7, 2026\n\nManage subscriptions →\n\nApple',
    time: 'Jun 6', date: 'Last week', isRead: true, isStarred: false, triage: 'can_wait', category: 'UPDATES',
  },
];

const MOCK_EVENTS: MockEvent[] = [
  { id: 'e1', title: 'Code', start: '02:15', end: '03:00', color: 'bg-accent-blue', day: 25 },
  { id: 'e2', title: 'Team standup', start: '10:00', end: '10:30', color: 'bg-emerald-500', day: 25 },
  { id: 'e3', title: 'Design review', start: '14:00', end: '15:00', color: 'bg-violet-500', day: 26 },
  { id: 'e4', title: 'Hackathon demo', start: '16:00', end: '17:30', color: 'bg-amber-500', day: 27 },
];

const MOCK_PRS: MockPR[] = [
  { id: 'pr1', title: 'Add keyboard shortcut system', repo: 'satyasootar/supereye', author: 'satyasootar', status: 'open', updated: '2h ago' },
  { id: 'pr2', title: 'Fix calendar sync timezone drift', repo: 'satyasootar/supereye', author: 'cursor-agent', status: 'open', updated: '5h ago' },
  { id: 'pr3', title: 'Landing page mock dashboard polish', repo: 'satyasootar/supereye', author: 'satyasootar', status: 'merged', updated: '1d ago' },
  { id: 'pr4', title: 'Drive plugin file preview', repo: 'satyasootar/supereye', author: 'satyasootar', status: 'open', updated: '2d ago' },
];

const MOCK_FILES: MockFile[] = [
  { id: 'f1', name: 'Q2 Roadmap.docx', type: 'document', modified: 'Today', icon: '📄' },
  { id: 'f2', name: 'supereye-mockups.fig', type: 'design', modified: 'Yesterday', icon: '🎨' },
  { id: 'f3', name: 'pitch-deck-v3.pdf', type: 'pdf', modified: 'Jun 20', icon: '📕' },
  { id: 'f4', name: 'user-research-notes', type: 'folder', modified: 'Jun 18', icon: '📁' },
];

const SIDEBAR_NAV = [
  { icon: Inbox, label: 'Inbox', id: 'INBOX' },
  { icon: Mail, label: 'All Mail', id: 'ALL' },
  { icon: FileText, label: 'Drafts', id: 'DRAFT' },
  { icon: Send, label: 'Sent', id: 'SENT' },
  { icon: Archive, label: 'Archive', id: 'ARCHIVE' },
  { icon: Trash2, label: 'Trash', id: 'TRASH' },
];

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Mail' },
  { id: 'PRIMARY', label: 'Primary' },
  { id: 'PROMOTIONS', label: 'Promotions' },
  { id: 'SOCIAL', label: 'Social' },
  { id: 'UPDATES', label: 'Updates' },
];

const GITHUB_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'repo', label: 'Repository', icon: FolderGit2 },
] as const;

const springTransition = { type: 'spring' as const, stiffness: 280, damping: 32, mass: 0.9 };

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

function WorkspaceLayoutLabel({
  primary,
  sidebar,
  subdued = false,
}: {
  primary: PluginId;
  sidebar: PluginId;
  subdued?: boolean;
}) {
  const iconSize = subdued ? 10 : 12;
  const textSize = subdued ? 'text-[9px]' : 'text-[11px]';

  return (
    <div className={cn('flex min-w-0 items-center gap-1 truncate', textSize)}>
      <span className="inline-flex min-w-0 items-center gap-1">
        <PluginBrandIcon pluginId={primary} size={iconSize} className="shrink-0 rounded-[3px] ring-1 ring-accent-blue/30" />
        <span className={cn('truncate font-semibold text-text-primary', subdued && 'font-medium text-text-secondary')}>
          {primary === 'email' ? 'Gmail' : primary === 'calendar' ? 'Calendar' : primary === 'github' ? 'GitHub' : 'Drive'}
        </span>
      </span>
      <span className="shrink-0 text-text-muted/45">+</span>
      <span className="inline-flex min-w-0 items-center gap-1 opacity-80">
        <PluginBrandIcon pluginId={sidebar} size={iconSize - 2} className="shrink-0" />
        <span className="truncate font-normal text-text-muted">
          {sidebar === 'email' ? 'Gmail' : sidebar === 'calendar' ? 'Calendar' : sidebar === 'github' ? 'GitHub' : 'Drive'}
        </span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MockDashboard() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('ws-1');
  const [primary, setPrimary] = useState<PluginId>('email');
  const [sidebar, setSidebar] = useState<PluginId>('calendar');
  const [wsOpen, setWsOpen] = useState(false);
  const [isBriefActive, setIsBriefActive] = useState(false);
  const [rightExpanded, setRightExpanded] = useState(true);

  const [emails, setEmails] = useState(MOCK_EMAILS);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeSidebarItem, setActiveSidebarItem] = useState('Inbox');
  const [activeTriageFilter, setActiveTriageFilter] = useState<'all' | 'urgent' | 'can_wait'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState('');

  const [calMonth, setCalMonth] = useState(5);
  const [calYear, setCalYear] = useState(2026);
  const [selectedCalDay, setSelectedCalDay] = useState(25);
  const [calView, setCalView] = useState<'Week' | 'Month'>('Week');

  const [githubSection, setGithubSection] = useState<'overview' | 'inbox' | 'repo'>('overview');
  const [selectedPR, setSelectedPR] = useState<string | null>(null);
  const [driveSection, setDriveSection] = useState<'recent' | 'browse'>('recent');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const wsRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = MOCK_WORKSPACES.find((w) => w.id === activeWorkspaceId) ?? MOCK_WORKSPACES[0];
  const selectedEmail = emails.find((e) => e.id === selectedEmailId) ?? null;

  const switchWorkspace = useCallback((id: string) => {
    const ws = MOCK_WORKSPACES.find((w) => w.id === id);
    if (!ws) return;
    setActiveWorkspaceId(id);
    setPrimary(ws.primary);
    setSidebar(ws.sidebar);
    setSelectedEmailId(null);
    setWsOpen(false);
  }, []);

  const switchPlugin = useCallback(() => {
    setPrimary(sidebar);
    setSidebar(primary);
    setSelectedEmailId(null);
  }, [primary, sidebar]);

  useEffect(() => {
    if (!wsOpen) return;
    const handler = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) setWsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [wsOpen]);

  const calDays = useMemo(() => generateCalendarDays(calYear, calMonth), [calYear, calMonth]);
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = new Date();
  const isToday = (d: Date) =>
    d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  const isCurrentMonth = (d: Date) => d.getMonth() === calMonth && d.getFullYear() === calYear;

  const filteredEmails = useMemo(() => {
    let list = [...emails];
    if (activeSidebarItem === 'Inbox') list = list.filter((e) => !e.isRead || e.triage === 'urgent');
    if (activeCategory !== 'ALL') list = list.filter((e) => e.category === activeCategory);
    if (activeTriageFilter === 'urgent') list = list.filter((e) => e.triage === 'urgent');
    if (activeTriageFilter === 'can_wait') list = list.filter((e) => e.triage === 'can_wait');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.sender.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.snippet.toLowerCase().includes(q)
      );
    }
    return list;
  }, [emails, activeSidebarItem, activeCategory, activeTriageFilter, searchQuery]);

  const emailGroups = useMemo(() => {
    const groups: { title: string; emails: MockEmail[] }[] = [];
    const map = new Map<string, MockEmail[]>();
    filteredEmails.forEach((e) => {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    });
    map.forEach((items, title) => groups.push({ title, emails: items }));
    return groups;
  }, [filteredEmails]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: emails.length };
    emails.forEach((e) => {
      counts[e.category] = (counts[e.category] ?? 0) + 1;
    });
    return counts;
  }, [emails]);

  const triageCounts = useMemo(() => ({
    urgent: emails.filter((e) => e.triage === 'urgent').length,
    canWait: emails.filter((e) => e.triage === 'can_wait').length,
  }), [emails]);

  const handleSelectEmail = (email: MockEmail) => {
    setSelectedEmailId(email.id);
    if (!email.isRead) {
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e)));
    }
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails((prev) => prev.map((em) => (em.id === id ? { ...em, isStarred: !em.isStarred } : em)));
  };

  const archiveEmail = () => {
    if (!selectedEmailId) return;
    setEmails((prev) => prev.filter((e) => e.id !== selectedEmailId));
    setSelectedEmailId(null);
  };

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

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 7);

  const renderLeftNav = () => {
    if (primary === 'calendar') {
      return (
        <>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle flex-shrink-0">
            <Calendar className="h-3.5 w-3.5 text-accent-blue" />
            <span className="text-[12px] font-semibold text-text-primary">Calendar</span>
          </div>
          <div className="px-3 py-2 flex-shrink-0">
            <button className="flex w-full h-9 items-center justify-center gap-2 rounded-md bg-accent-blue text-[12px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" />
              New Event
            </button>
          </div>
          <nav className="mt-1 flex flex-col gap-0.5 px-2 flex-shrink-0">
            {(['Week', 'Month', 'Day'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCalView(view === 'Day' ? 'Week' : view)}
                className={cn(
                  'flex items-center rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                  (calView === view || (view === 'Day' && calView === 'Week'))
                    ? 'bg-bg-highlight text-text-primary border-l-2 border-accent-blue rounded-l-none'
                    : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary border-l-2 border-transparent'
                )}
              >
                {view}
              </button>
            ))}
          </nav>
        </>
      );
    }

    if (primary === 'github') {
      return (
        <>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle flex-shrink-0">
            <GitPullRequest className="h-3.5 w-3.5 text-accent-blue" />
            <span className="text-[12px] font-semibold text-text-primary">GitHub</span>
          </div>
          <nav className="mt-1 flex flex-col gap-0.5 px-2 flex-shrink-0">
            {GITHUB_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setGithubSection(s.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                  githubSection === s.id
                    ? 'bg-bg-highlight text-text-primary border-l-2 border-accent-blue rounded-l-none'
                    : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary border-l-2 border-transparent'
                )}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </nav>
        </>
      );
    }

    if (primary === 'drive') {
      return (
        <>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle flex-shrink-0">
            <HardDrive className="h-3.5 w-3.5 text-accent-blue" />
            <span className="text-[12px] font-semibold text-text-primary">Drive</span>
          </div>
          <nav className="mt-1 flex flex-col gap-0.5 px-2 flex-shrink-0">
            {(['recent', 'browse'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setDriveSection(s)}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors capitalize',
                  driveSection === s
                    ? 'bg-bg-highlight text-text-primary border-l-2 border-accent-blue rounded-l-none'
                    : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary border-l-2 border-transparent'
                )}
              >
                {s === 'recent' ? <Clock className="h-3.5 w-3.5" /> : <FolderOpen className="h-3.5 w-3.5" />}
                {s}
              </button>
            ))}
          </nav>
        </>
      );
    }

    return (
      <>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border-subtle flex-shrink-0">
          <Mail className="h-3.5 w-3.5 text-accent-blue" />
          <span className="text-[12px] font-semibold text-text-primary">Email</span>
        </div>
        <div className="px-3 py-2 flex-shrink-0">
          <button
            onClick={() => setShowCompose(true)}
            className="flex w-full h-9 items-center justify-center gap-2 rounded-md bg-accent-blue text-[12px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <Edit className="h-3.5 w-3.5" />
            Compose
          </button>
        </div>
        <nav className="mt-1 flex flex-col gap-0.5 px-2 flex-shrink-0">
          {SIDEBAR_NAV.map((item) => {
            const isActive = activeSidebarItem === item.label;
            const count = item.label === 'Inbox' ? emails.filter((e) => !e.isRead).length : 0;
            return (
              <button
                key={item.label}
                onClick={() => setActiveSidebarItem(item.label)}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                  isActive
                    ? 'bg-bg-highlight text-text-primary border-l-2 border-accent-blue rounded-l-none'
                    : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary border-l-2 border-transparent'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                {count > 0 && (
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', isActive ? 'bg-accent-blue text-white' : 'text-text-muted')}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="mt-3 px-2 flex-shrink-0">
          <div className="flex items-center px-3 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">AI Triage</span>
          </div>
          <div className="mt-0.5 flex flex-col gap-0.5">
            {[
              { icon: Inbox, label: 'All mail', filter: 'all' as const, count: 0 },
              { icon: Flame, label: 'Urgent', filter: 'urgent' as const, count: triageCounts.urgent },
              { icon: Clock, label: 'Can wait', filter: 'can_wait' as const, count: triageCounts.canWait },
            ].map((item) => {
              const isActive = activeTriageFilter === item.filter;
              return (
                <button
                  key={item.filter}
                  onClick={() => setActiveTriageFilter(item.filter)}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                    isActive
                      ? 'bg-bg-highlight text-text-primary border-l-2 border-accent-blue rounded-l-none'
                      : 'text-text-secondary hover:bg-bg-overlay hover:text-text-primary border-l-2 border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </div>
                  {item.count > 0 && (
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', item.filter === 'urgent' ? 'text-[color:var(--priority-urgent,#ef4444)]' : 'text-text-muted')}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  const renderEmailMain = () => (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <div className={cn('flex h-full min-h-0 flex-col overflow-hidden transition-all duration-200', selectedEmail ? 'w-[48%]' : 'w-full')}>
        <div className="flex h-[48px] flex-shrink-0 items-center justify-between px-4 border-b border-border-subtle bg-bg-app">
          <div className="flex items-center gap-2 text-text-primary">
            <Archive className="h-4 w-4 text-accent-blue" />
            <h1 className="text-[15px] font-semibold">{activeSidebarItem}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border-default bg-bg-surface w-[160px]">
              <Search className="h-3 w-3 text-text-muted shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emails..."
                className="bg-transparent border-none outline-none text-[11px] text-text-primary placeholder:text-text-muted w-full min-w-0"
              />
            </div>
            <button className="flex items-center gap-1 px-2 py-1 rounded-full border border-border-default bg-bg-surface text-[11px] font-medium text-text-secondary hover:bg-bg-highlight transition-colors">
              <Users className="h-3 w-3" />
              Senders
            </button>
            <button className="flex items-center gap-1 px-2 py-1 rounded-full border border-border-default bg-bg-surface text-[11px] font-medium text-text-secondary hover:bg-bg-highlight transition-colors">
              <Tag className="h-3 w-3" />
              Labels
            </button>
          </div>
        </div>
        <div className="flex-none px-3 py-1.5 border-b border-border-subtle bg-bg-surface/50 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition-colors',
                  activeCategory === tab.id ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                )}
              >
                {tab.label}
                <span className={cn('px-1 py-0.5 rounded-full text-[9px] leading-none font-bold', activeCategory === tab.id ? 'bg-accent-blue text-white' : 'bg-border-subtle text-text-secondary')}>
                  {categoryCounts[tab.id] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-2">
          {emailGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <Mail className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-[12px]">No emails match your filters</p>
            </div>
          ) : (
            emailGroups.map((group) => (
              <div key={group.title} className="mb-2">
                <div className="px-2 py-1.5 text-[12px] font-semibold text-text-primary sticky top-0 bg-bg-app z-10 opacity-90">{group.title}</div>
                {group.emails.map((email) => {
                  const isSelected = selectedEmailId === email.id;
                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={cn(
                        'group relative flex items-center gap-2 px-2 py-[6px] border-l-2 transition-colors cursor-pointer rounded-r-md',
                        isSelected ? 'bg-bg-highlight border-accent-blue text-text-primary' : 'border-transparent text-text-secondary hover:bg-bg-overlay',
                        !email.isRead && !isSelected && 'bg-bg-surface/40'
                      )}
                    >
                      <button onClick={(e) => toggleStar(email.id, e)} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Star className={cn('h-3 w-3', email.isStarred ? 'fill-amber-400 text-amber-400 opacity-100' : 'text-text-muted')} />
                      </button>
                      <div className="flex items-center flex-shrink-0 w-[120px]">
                        <span className={cn('truncate text-[12px]', !email.isRead ? 'font-semibold text-text-primary' : 'text-text-muted font-normal')}>{email.sender}</span>
                      </div>
                      <div className="flex-1 flex items-center overflow-hidden gap-1.5 min-w-0">
                        {email.triage === 'urgent' && (
                          <span className="flex-shrink-0 px-1 py-0.5 rounded text-[8px] font-bold bg-red-500/15 text-red-400">⚡</span>
                        )}
                        <span className={cn('truncate text-[12px] flex-shrink-0 max-w-[35%]', !email.isRead ? 'font-semibold text-text-primary' : 'text-text-muted font-normal')}>{email.subject}</span>
                        <span className="truncate text-[12px] text-text-muted opacity-70 min-w-0">{email.snippet}</span>
                      </div>
                      <div className="flex items-center justify-end flex-shrink-0 w-[55px]">
                        <span className="text-[11px] font-medium text-text-muted">{email.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
      <AnimatePresence>
        {selectedEmail && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex h-full min-h-0 flex-1 flex-col border-l border-border-subtle bg-bg-surface overflow-hidden"
          >
            <div className="flex-shrink-0 border-b border-border-subtle bg-bg-base px-3 py-3">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setSelectedEmailId(null)} className="p-1 text-text-secondary hover:text-text-primary hover:bg-bg-overlay rounded transition-colors">
                  <ChevronsRight className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center gap-0.5 text-text-secondary">
                  <button onClick={archiveEmail} className="p-1 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors"><Archive className="h-3 w-3" /></button>
                  <button onClick={() => { setEmails((p) => p.filter((e) => e.id !== selectedEmailId)); setSelectedEmailId(null); }} className="p-1 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors"><Trash2 className="h-3 w-3" /></button>
                  <button className="p-1 rounded hover:bg-bg-overlay hover:text-text-primary transition-colors"><MoreHorizontal className="h-3 w-3" /></button>
                </div>
              </div>
              <h2 className="text-[13px] font-semibold text-text-primary leading-tight">{selectedEmail.subject}</h2>
            </div>
            <div className="flex-shrink-0 px-3 py-2 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] font-semibold text-text-primary">{selectedEmail.sender}</span>
                  <span className="text-[10px] text-text-secondary">To: me</span>
                </div>
                <span className="text-[10px] text-text-secondary font-medium">{selectedEmail.time}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3">
              <div className="text-[11.5px] leading-[1.65] text-text-primary whitespace-pre-wrap">{selectedEmail.body}</div>
            </div>
            <div className="flex-shrink-0 px-3 py-2 border-t border-border-subtle flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-accent-blue/30 text-accent-blue text-[11px] hover:bg-bg-highlight/50 transition-colors bg-bg-app font-medium"><Reply className="h-3 w-3" />Reply</button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-accent-blue/30 text-accent-blue text-[11px] hover:bg-bg-highlight/50 transition-colors bg-bg-app font-medium"><Forward className="h-3 w-3" />Forward</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderCalendarMain = () => (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-app">
      <div className="flex h-[48px] flex-shrink-0 items-center justify-between px-4 border-b border-border-subtle bg-bg-surface">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-semibold text-text-primary">{monthLabel}</h1>
          <div className="flex rounded-lg border border-border-default p-0.5">
            {(['Week', 'Month'] as const).map((v) => (
              <button key={v} onClick={() => setCalView(v)} className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors', calView === v ? 'bg-bg-highlight text-text-primary' : 'text-text-muted hover:text-text-primary')}>{v}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-bg-overlay text-text-muted"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => { setCalMonth(today.getMonth()); setCalYear(today.getFullYear()); setSelectedCalDay(today.getDate()); }} className="px-2 py-0.5 text-[11px] font-medium text-accent-blue hover:underline">Today</button>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-bg-overlay text-text-muted"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      {calView === 'Week' ? (
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-border-subtle">
            <div />
            {weekDays.map((d, i) => (
              <div key={d} className={cn('py-2 text-center text-[11px] font-medium border-l border-border-subtle', selectedCalDay === 23 + i ? 'text-accent-blue' : 'text-text-muted')}>
                <div>{d}</div>
                <div className={cn('mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[12px]', selectedCalDay === 23 + i ? 'bg-accent-blue text-white font-bold' : 'text-text-primary')}>{23 + i}</div>
              </div>
            ))}
          </div>
          <div className="relative">
            {hours.map((h) => (
              <div key={h} className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-border-subtle/50 min-h-[44px]">
                <div className="pr-2 pt-1 text-right text-[10px] text-text-muted font-mono">{h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}</div>
                {weekDays.map((_, di) => {
                  const dayNum = 23 + di;
                  const event = MOCK_EVENTS.find((e) => e.day === dayNum && parseInt(e.start) === h);
                  return (
                    <div key={di} onClick={() => setSelectedCalDay(dayNum)} className="border-l border-border-subtle/50 relative cursor-pointer hover:bg-bg-overlay/30 transition-colors">
                      {event && (
                        <div className={cn('absolute left-0.5 right-0.5 top-0.5 rounded px-1 py-0.5 text-[9px] font-medium text-white truncate', event.color)}>
                          {event.title}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="text-[10px] font-mono text-text-muted py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((dateObj, i) => {
              const hasEvent = MOCK_EVENTS.some((e) => e.day === dateObj.getDate() && dateObj.getMonth() === calMonth);
              return (
                <button
                  key={i}
                  onClick={() => { setSelectedCalDay(dateObj.getDate()); setCalView('Week'); }}
                  className={cn(
                    'flex h-8 items-center justify-center rounded-full text-[11px] transition-colors',
                    isCurrentMonth(dateObj) ? 'text-text-primary' : 'text-text-muted/30',
                    selectedCalDay === dateObj.getDate() && isCurrentMonth(dateObj) && 'bg-accent-blue/20 ring-1 ring-accent-blue',
                    isToday(dateObj) && 'bg-accent-blue text-white font-bold'
                  )}
                >
                  {dateObj.getDate()}
                  {hasEvent && isCurrentMonth(dateObj) && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent-blue" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderGithubMain = () => (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-app">
      <div className="flex h-[48px] flex-shrink-0 items-center justify-between px-4 border-b border-border-subtle bg-bg-surface">
        <div className="flex rounded-lg border border-border-default p-0.5">
          {GITHUB_SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setGithubSection(id)} className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors', githubSection === id ? 'bg-bg-highlight text-text-primary' : 'text-text-muted hover:text-text-primary')}>
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
        <button className="flex h-7 w-7 items-center justify-center rounded-md border border-border-default text-text-muted hover:bg-bg-highlight transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className={cn('flex flex-col border-r border-border-subtle overflow-y-auto custom-scrollbar transition-all', selectedPR ? 'w-[45%]' : 'w-full')}>
          {MOCK_PRS.map((pr) => (
            <button
              key={pr.id}
              onClick={() => setSelectedPR(pr.id)}
              className={cn(
                'flex flex-col gap-0.5 px-4 py-3 text-left border-b border-border-subtle/50 transition-colors',
                selectedPR === pr.id ? 'bg-bg-highlight' : 'hover:bg-bg-overlay'
              )}
            >
              <div className="flex items-center gap-2">
                <GitPullRequest className={cn('h-3.5 w-3.5', pr.status === 'merged' ? 'text-purple-400' : 'text-emerald-400')} />
                <span className="text-[12px] font-medium text-text-primary truncate">{pr.title}</span>
              </div>
              <span className="text-[10px] text-text-muted pl-5">{pr.repo} · {pr.updated}</span>
            </button>
          ))}
        </div>
        <AnimatePresence>
          {selectedPR && (
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden">
              {(() => {
                const pr = MOCK_PRS.find((p) => p.id === selectedPR)!;
                return (
                  <>
                    <div className="px-4 py-3 border-b border-border-subtle">
                      <button onClick={() => setSelectedPR(null)} className="text-[10px] text-text-muted hover:text-text-primary mb-2">← Back</button>
                      <h2 className="text-[13px] font-semibold text-text-primary">{pr.title}</h2>
                      <p className="text-[10px] text-text-muted mt-1">{pr.repo} · opened by {pr.author}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 text-[11px] text-text-secondary leading-relaxed">
                      <p>This PR {pr.status === 'merged' ? 'was merged' : 'is open'} and ready for review.</p>
                      <p className="mt-3">+142 −38 across 8 files</p>
                      <div className="mt-4 rounded-md border border-border-subtle bg-bg-surface p-3 font-mono text-[10px]">
                        <span className="text-emerald-400">+ export function MockDashboard()</span><br />
                        <span className="text-text-muted">  // interactive landing preview</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderDriveMain = () => (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-bg-app">
      <div className="flex h-[48px] flex-shrink-0 items-center justify-between px-4 border-b border-border-subtle bg-bg-surface">
        <div className="flex rounded-lg border border-border-default p-0.5">
          {(['recent', 'browse'] as const).map((s) => (
            <button key={s} onClick={() => setDriveSection(s)} className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-colors', driveSection === s ? 'bg-bg-highlight text-text-primary' : 'text-text-muted hover:text-text-primary')}>
              {s === 'recent' ? <Clock className="h-3 w-3" /> : <FolderOpen className="h-3 w-3" />}
              {s}
            </button>
          ))}
        </div>
        <button className="flex h-7 w-7 items-center justify-center rounded-md border border-border-default text-text-muted hover:bg-bg-highlight transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        <div className="grid grid-cols-2 gap-2">
          {MOCK_FILES.map((file) => (
            <button
              key={file.id}
              onClick={() => setSelectedFile(selectedFile === file.id ? null : file.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors',
                selectedFile === file.id ? 'border-accent-blue bg-accent-blue/5' : 'border-border-subtle hover:bg-bg-overlay'
              )}
            >
              <span className="text-lg">{file.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-text-primary">{file.name}</p>
                <p className="text-[9px] text-text-muted">{file.modified}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMain = () => {
    if (primary === 'email') return renderEmailMain();
    if (primary === 'calendar') return renderCalendarMain();
    if (primary === 'github') return renderGithubMain();
    if (primary === 'drive') return renderDriveMain();
    return null;
  };

  const renderSecondaryPanel = () => {
    const width = rightExpanded ? 220 : 48;
    const pluginMeta = {
      email: { icon: Mail, label: 'Gmail' },
      calendar: { icon: Calendar, label: 'Calendar' },
      github: { icon: GitPullRequest, label: 'GitHub' },
      drive: { icon: HardDrive, label: 'Drive' },
    };
    const meta = pluginMeta[sidebar];
    const Icon = meta.icon;

    return (
      <motion.div
        animate={{ width }}
        transition={springTransition}
        className="relative h-full flex-shrink-0 overflow-hidden border-l border-border-subtle bg-bg-surface"
      >
        {rightExpanded ? (
          <div className="flex h-full flex-col">
            <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-border-subtle px-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setRightExpanded(false)} className="rounded-md p-1 text-text-muted hover:bg-bg-overlay hover:text-text-primary transition-colors">
                  <PanelRightClose className="h-3.5 w-3.5" />
                </button>
                <Icon className="h-3.5 w-3.5 text-accent-blue" />
                <span className="text-[12px] font-semibold text-text-primary">{meta.label}</span>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {sidebar === 'calendar' && (
                <div className="flex h-full flex-col overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
                    <span className="text-[11px] font-semibold text-text-primary">{monthLabel}</span>
                    <div className="flex gap-0.5">
                      <button onClick={prevMonth} className="p-0.5 rounded hover:bg-bg-overlay"><ChevronLeft className="h-3 w-3" /></button>
                      <button onClick={nextMonth} className="p-0.5 rounded hover:bg-bg-overlay"><ChevronRight className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="px-3 py-2 border-b border-border-subtle">
                    <div className="grid grid-cols-7 gap-y-0.5 text-center mb-1">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                        <div key={d} className="text-[8px] font-mono text-text-muted">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-0.5 text-center">
                      {calDays.map((dateObj, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedCalDay(dateObj.getDate())}
                          className={cn('flex h-5 w-full items-center justify-center text-[9px] rounded-full transition-colors', isCurrentMonth(dateObj) ? 'text-text-primary hover:bg-bg-overlay' : 'text-text-muted/30')}
                        >
                          <span className={cn('flex h-4 w-4 items-center justify-center rounded-full', isToday(dateObj) ? 'bg-accent-blue text-white font-bold' : selectedCalDay === dateObj.getDate() && isCurrentMonth(dateObj) ? 'bg-bg-highlight' : '')}>
                            {dateObj.getDate()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 px-2 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-1 px-2 mb-1.5">
                      <ChevronDown className="h-3 w-3 text-text-muted" />
                      <span className="text-[9px] font-semibold text-text-secondary uppercase tracking-wider">Upcoming</span>
                    </div>
                    {MOCK_EVENTS.slice(0, 3).map((evt) => (
                      <div key={evt.id} className="flex gap-2 rounded-lg p-1.5 hover:bg-bg-overlay cursor-pointer transition-colors mb-1">
                        <div className={cn('mt-1 h-1.5 w-1.5 rounded-full shrink-0', evt.color)} />
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-medium text-text-primary">{evt.title}</p>
                          <p className="text-[9px] text-text-muted">Jun {evt.day}, {evt.start}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {sidebar === 'email' && (
                <div className="flex h-full flex-col overflow-hidden">
                  <div className="px-3 py-2 border-b border-border-subtle">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-border-default bg-bg-elevated">
                      <Search className="h-3 w-3 text-text-muted" />
                      <span className="text-[10px] text-text-muted">Search inbox…</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {emails.slice(0, 10).map((email) => (
                      <button
                        key={email.id}
                        onClick={() => { setPrimary('email'); handleSelectEmail(email); }}
                        className="flex w-full flex-col gap-0.5 px-3 py-2 text-left border-b border-border-subtle/40 hover:bg-bg-overlay transition-colors"
                      >
                        <span className={cn('text-[10px] truncate', !email.isRead ? 'font-semibold text-text-primary' : 'text-text-muted')}>{email.sender}</span>
                        <span className="text-[10px] text-text-muted truncate">{email.subject}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {sidebar === 'github' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {MOCK_PRS.slice(0, 3).map((pr) => (
                    <button key={pr.id} onClick={() => { setPrimary('github'); setSelectedPR(pr.id); }} className="flex w-full flex-col gap-0.5 rounded-md p-2 text-left hover:bg-bg-overlay transition-colors mb-1">
                      <span className="text-[10px] font-medium text-text-primary truncate">{pr.title}</span>
                      <span className="text-[9px] text-text-muted">{pr.updated}</span>
                    </button>
                  ))}
                </div>
              )}
              {sidebar === 'drive' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {MOCK_FILES.map((file) => (
                    <button key={file.id} onClick={() => { setPrimary('drive'); setSelectedFile(file.id); }} className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-bg-overlay transition-colors mb-1">
                      <span>{file.icon}</span>
                      <span className="text-[10px] text-text-primary truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full w-[48px] flex-col items-center gap-2 py-3">
            <button onClick={() => setRightExpanded(true)} className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-accent-blue/10 hover:text-accent-blue transition-colors">
              <PanelRightOpen className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setRightExpanded(true)} className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg-overlay hover:text-text-primary transition-colors">
              <Icon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-b-[var(--radius-lg)]" style={{ fontSize: '13px' }}>
      {/* Brief overlay hint */}
      <AnimatePresence>
        {isBriefActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-bg-app/80 backdrop-blur-sm"
            onClick={() => setIsBriefActive(false)}
          >
            <div className="rounded-xl border border-violet-500/30 bg-bg-elevated px-8 py-6 text-center shadow-xl max-w-sm" onClick={(e) => e.stopPropagation()}>
              <Star className="h-8 w-8 mx-auto mb-3 fill-violet-400 text-violet-400" />
              <h3 className="text-[15px] font-semibold text-text-primary">Today&apos;s Brief</h3>
              <p className="mt-2 text-[12px] text-text-muted">3 urgent emails · 2 meetings · 1 PR to review</p>
              <button onClick={() => setIsBriefActive(false)} className="mt-4 rounded-md bg-accent-blue px-4 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 transition-opacity">Got it</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compose overlay */}
      <AnimatePresence>
        {showCompose && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 right-4 z-40 w-[320px] rounded-lg border border-border-default bg-bg-elevated shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-bg-surface">
              <span className="text-[12px] font-semibold text-text-primary">New Message</span>
              <button onClick={() => setShowCompose(false)} className="text-text-muted hover:text-text-primary text-[14px]">×</button>
            </div>
            <div className="p-3 space-y-2">
              <input placeholder="To" className="w-full bg-transparent border-b border-border-subtle py-1 text-[11px] text-text-primary outline-none placeholder:text-text-muted" />
              <input placeholder="Subject" className="w-full bg-transparent border-b border-border-subtle py-1 text-[11px] text-text-primary outline-none placeholder:text-text-muted" />
              <textarea
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                placeholder="Write your message..."
                rows={4}
                className="w-full bg-bg-surface rounded-md border border-border-subtle p-2 text-[11px] text-text-primary outline-none resize-none placeholder:text-text-muted"
              />
              <button onClick={() => { setShowCompose(false); setComposeText(''); }} className="rounded-md bg-accent-blue px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 transition-opacity">Send</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Left Sidebar ── */}
      <div className="flex h-full w-[220px] flex-shrink-0 flex-col border-r border-border-subtle bg-bg-surface overflow-hidden">
        <div className="flex-shrink-0 px-2 py-2 border-b border-border-subtle flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0 relative" ref={wsRef}>
              <button
                type="button"
                onClick={() => setWsOpen((o) => !o)}
                className="flex w-full items-center gap-2 rounded-md border border-border-subtle bg-bg-highlight/60 px-2 py-2 text-left transition-colors hover:bg-bg-highlight"
              >
                <div className="min-w-0 flex-1">
                  {activeWorkspace.name && (
                    <p className="truncate text-[10px] font-medium text-text-muted">{activeWorkspace.name}</p>
                  )}
                  <WorkspaceLayoutLabel primary={primary} sidebar={sidebar} subdued={!!activeWorkspace.name} />
                </div>
                <ChevronDown className={cn('h-3 w-3 shrink-0 text-text-muted transition-transform', wsOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {wsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border-default bg-bg-elevated p-1 shadow-lg"
                  >
                    {MOCK_WORKSPACES.map((ws, i) => (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => switchWorkspace(ws.id)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors',
                          activeWorkspaceId === ws.id ? 'bg-bg-highlight text-text-primary' : 'text-text-muted hover:bg-bg-surface hover:text-text-primary'
                        )}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-bg-overlay font-mono text-[9px] text-text-muted">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          {ws.name && <p className="truncate text-[11px] font-medium">{ws.name}</p>}
                          <WorkspaceLayoutLabel primary={ws.primary} sidebar={ws.sidebar} subdued={!!ws.name} />
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={switchPlugin}
              title="Switch plugin"
              className="flex w-9 items-center justify-center rounded-md border border-border-subtle bg-bg-highlight/60 text-text-muted transition-colors hover:bg-bg-highlight hover:text-text-primary self-stretch shrink-0"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsBriefActive(true)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors',
              isBriefActive
                ? 'border-violet-500/35 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 text-text-primary shadow-sm ring-1 ring-violet-500/25'
                : 'border-border-subtle bg-bg-highlight/60 text-text-secondary hover:border-border-default hover:bg-bg-highlight hover:text-text-primary'
            )}
          >
            <Star className={cn('h-3.5 w-3.5', isBriefActive ? 'fill-violet-400 text-violet-400' : 'text-text-muted')} />
            Today
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {renderLeftNav()}
        </div>
      </div>

      {/* ── Main Panel ── */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-bg-app relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={primary}
            className="absolute inset-0 h-full w-full"
            initial={{ opacity: 0, x: primary === 'calendar' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: primary === 'calendar' ? 20 : -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderMain()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Right Secondary Panel ── */}
      {renderSecondaryPanel()}
    </div>
  );
}
