<div align="center">
  <h1>Supereye</h1>
  <p><strong>Your entire workday. One intelligent workspace.</strong></p>
  <p>A unified AI-powered command center that connects Gmail, Google Calendar, GitHub, and Google Drive — so you stop switching tabs and start getting things done.</p>
  <br/>
  <img src="https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/AI-Mistral%20%2F%20OpenAI-ff7000?style=flat-square" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-336791?style=flat-square&logo=postgresql" />
</div>

---

##  Demo

<!-- DEMO VIDEO PLACEHOLDER -->
```
https://youtu.be/0AcqoR-d6SQ
```


## YC- video
```
https://youtu.be/HYDXgFp9cBw
```
---

## 🧭 My Journey

> **Building in public**

| Episode | What I covered |
|---------|----------------|
| 🎬 Ep. 1 | https://x.com/satyasootar/status/2066224352161632516?s=20 |
| 🎬 Ep. 2 | https://x.com/satyasootar/status/2066534982097764804?s=20 |
| 🎬 Ep. 3 | https://x.com/satyasootar/status/2066755147926225085?s=20 |
| 🎬 Ep. 4 | https://x.com/satyasootar/status/2067129342858260839?s=20 |
| 🎬 Ep. 5 | https://x.com/satyasootar/status/2067259326218297570?s=20 |
| 🎬 Ep. 6 | https://x.com/satyasootar/status/2067559717271110099?s=20 |
| 🎬 Ep. 7 | https://x.com/satyasootar/status/2067661117795500385?s=20 |>

---

## The Problem

Modern knowledge workers live across 4–6 different tools simultaneously. You get an email asking to schedule a meeting — so you open Calendar. You're on a call and someone asks about a PR — so you flip to GitHub. A colleague shares a Drive doc in an email — you open that in a third tab.

**Every context switch costs you 20+ minutes of deep focus.** By end of day, you've spent more time *navigating* your tools than actually *using* them.

The deeper problem is that these tools are **intrinsically linked** but artificially separated:
- An email often *becomes* a calendar event
- A calendar event often has *attachments in Drive*
- A PR review often *needs an email follow-up*
- A task in your inbox is *blocking a meeting on your calendar*

Email clients show you email. Calendar apps show you events. GitHub shows you code. None of them understand the connections between them — and none of them let you *act* across all of them from a single place.

---

## The Solution

Supereye is a **unified daily command center** that treats your email, calendar, code, and files as one connected stream — not four separate silos.

Instead of switching between apps, you have **one intelligent workspace** where your AI assistant can:

- Read your Gmail inbox and summarize what needs attention
- Schedule a meeting and send the invite email in a single command
- Check open PRs on GitHub and notify the right people by email
- Find a file in Google Drive and attach the link to an outgoing email
- Clear your entire calendar for the day with one sentence
- Draft an email, let you review and edit it, then send — without you leaving the workspace

**The core insight:** your workday is a single stream of context. Supereye makes your tools reflect that reality.

---

## Features

### 🤖 AI Assistant — Supereye Agent

A conversational AI embedded directly in the workspace. You talk to it in plain English and it takes real actions across your connected services.

**What it can do:**

| Category | Actions |
|----------|---------|
| **Gmail** | Read inbox, summarize threads, draft emails, send emails, reply |
| **Google Calendar** | Schedule events, list today's agenda, add Google Meet, delete events, clear a day |
| **GitHub** | List open PRs, show issues, browse repositories |
| **Google Drive** | Find recent files, search documents, retrieve shareable links |
| **Multi-step** | "Email X, create a calendar event, and add a Meet link" — all in one command |

**Guided Mode (Interactive):** Toggle on when you want to *review before sending*. The agent drafts your email and shows you an editable review panel — with tone adjustments, rephrasing suggestions ("Make it more formal", "Make it shorter"), and calendar event editing — before anything is sent.

**Direct Mode (Default):** The agent acts immediately. Ask it to send an email and schedule a meeting — it does both, in order, and reports back.

**Animated task panels:** Every operation the agent performs is shown with a purpose-built animated UI:
- Calendar scheduling shows a live mini-calendar grid with the event "sliding into" its time slot
- Gmail composing shows a real typewriter-effect composer with a Send button that illuminates when ready
- GitHub operations show PR/issue cards with color-coded status badges
- Drive operations show staggered file reveals with a thin progress bar for uploads

---

### 📬 Unified Inbox

A premium email experience with everything you need, nothing you don't.

- **Full inbox view** with sender, subject, snippet, timestamp, and unread state
- **Read emails** in a full-pane reader with thread view
- **Compose and reply** with a rich global composer (supports To, CC, BCC, subject, body)
- **Quick actions** — archive, star, mark read/unread directly from the list
- **Sender filtering** — quickly filter by contact or domain
- **Advanced search** — filter by date, read/unread, starred, labels
- **Real-time updates** — new emails arrive via webhook → SSE without a manual refresh
- **Compact mode** — collapsible sidebar for focus time

---

### 📅 Google Calendar Integration

Your schedule, directly in the workspace — not in another tab.

- **Mini calendar** with month navigation in the sidebar, dot indicators for event days
- **Full calendar grid** with Day, Week, Month, and Year views
- **Create events** from a rich modal — title, date, time, location, attendees, Google Meet toggle
- **Click any event** to view full details and attendees
- **One-click scheduling from email context** — pre-fills attendees from email participants
- **Upcoming events list** always visible in the sidebar
- **Real-time sync** via Google Calendar webhooks

---

### 🐙 GitHub Integration

Your code activity, surfaced in your daily flow without opening a separate tab.

- **PR dashboard** — see all open pull requests across repos at a glance
- **Issue tracker** — browse open and closed issues
- **Repository overview** — recent commits, contributors, activity
- **Compact panel** for sidebar view; full panel for focused browsing
- **Agent-accessible** — ask the AI "what PRs are open?" and get a live answer

---

### 💾 Google Drive Integration

Your documents, discoverable without leaving your workspace.

- **Recent files** panel — see what you (or your team) touched last
- **Folder browser** — navigate your Drive hierarchy
- **File search** — find documents by name
- **Shared with me** section
- **Agent-accessible** — "find the design doc" and the agent retrieves it and can share the link in an email

---

### ⌨️ Command Palette

A `⌘K` / `Ctrl+K` command palette for keyboard-first users.

- Switch workspaces (Email, Calendar, GitHub, Drive)
- Navigate to any folder or view
- Trigger quick actions without touching the mouse

---

### 🎨 Theming & Appearance

- **Multiple themes** — Caffeine (dark), Sage, and more — each with a carefully curated color palette
- **Dark mode first** design with light mode support
- **Premium typography** — Inter font, tight tracking, balanced hierarchy
- All theme values are CSS variables — no hardcoded colors anywhere in the UI
- Smooth animations throughout using **Framer Motion** with spring physics (never linear, never instant)

---

### 🔔 Notifications

- Real-time notification bell for new emails and calendar reminders
- Notification panel with dismiss and action buttons

---

## How It Works

```
Your Browser
    │
    ├── Supereye UI (Next.js 16 + React 19)
    │       ├── Email workspace
    │       ├── Calendar workspace
    │       ├── GitHub workspace
    │       ├── Drive workspace
    │       └── AI Agent overlay
    │
    ▼
Next.js API Routes
    │
    ├── /api/agent/chat     ← Streaming AI responses (SSE)
    ├── /api/mail/*         ← Gmail read/write
    ├── /api/calendar/*     ← Google Calendar CRUD
    ├── /api/corsair/*      ← OAuth callback handler
    └── /api/webhooks/*     ← Real-time push from Gmail & Calendar
    │
    ▼
Corsair Integration Layer
    │
    ├── Gmail plugin         ← Handles OAuth, token refresh, API calls
    ├── Google Calendar      ← Same
    ├── GitHub plugin        ← GitHub OAuth + REST API
    └── Google Drive plugin  ← Drive OAuth + file operations
    │
    ▼
PostgreSQL 17
    ├── users, accounts, sessions (NextAuth)
    ├── emails (cached Gmail messages)
    ├── calendar_events (cached events)
    └── email_event_links (email ↔ event relationships)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.2.6 (App Router) |
| **UI** | React 19, Tailwind CSS v4 |
| **Animations** | Framer Motion 12 |
| **State** | Zustand 5 + TanStack Query 5 |
| **AI** | Vercel AI SDK — Mistral / OpenAI (auto-selects based on env) |
| **Integrations** | Corsair (Gmail, Calendar, GitHub, Drive) |
| **Auth** | NextAuth v5 (Google OAuth) |
| **Database** | PostgreSQL 17 + Drizzle ORM |
| **Real-time** | Server-Sent Events (SSE) + Google Cloud Pub/Sub webhooks |
| **Icons** | Lucide React |
| **Deployment** | Docker + VPS (with Caddy reverse proxy + HTTPS) |

---

## Who Is This For?

**Supereye is built for people who live in their inbox and calendar:**

- **Founders and solopreneurs** who manage everything themselves and can't afford tab chaos
- **Engineers** who need to bridge email communication with their GitHub workflow
- **Consultants** who spend their day in email, calendar, and client docs simultaneously  
- **Anyone who has ever opened 8 tabs to do something that should have taken 30 seconds**

If you've ever thought "I wish I could just *tell* someone to send this email and create this event" — that's Supereye.

---

## Design Philosophy

**Calm. Structured. Premium.**

Supereye is designed to feel like Linear or Notion — not like a startup demo or a dashboard.

- No gratuitous animations. Every motion has a reason.
- No neon gradients. Colors come from a curated theme system.
- No nested card-in-card-in-card layouts. Information breathes.
- The AI feels like watching an intelligent system work — not reading a log file.

The agent overlay, action panels, and workspace views are all designed to reduce cognitive load, not add to it.

---

## Self-Hosted & Privacy First

Supereye runs on your own infrastructure. Your emails, calendar data, and API tokens never touch a third-party server.

- Docker-based deployment with a single `docker compose up`
- PostgreSQL data stays on your VPS
- OAuth tokens encrypted at rest with Corsair's KEK (Key Encryption Key)
- Google Pub/Sub webhooks go directly to your server

---

## Roadmap

- [ ] **Email snooze** — hide a thread until a specific time
- [ ] **AI priority triage** — automatically tag emails as urgent / FYI / action required
- [ ] **Semantic search** — find emails and events by meaning, not just keywords
- [ ] **Multi-account support** — connect multiple Google accounts
- [ ] **Keyboard-first navigation** — vim-style j/k navigation throughout
- [ ] **Mobile responsive layout** — proper touch experience


---

<div align="center">
  <p>Built with ☕ and too many open tabs.</p>
  <p>
    <a href="https://supereye.dev">supereye.dev</a>
  </p>
</div>
