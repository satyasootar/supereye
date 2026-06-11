# Supereye — Project Plan & Core Feature Blueprint

> **Last Updated:** June 11, 2026  
> **Status:** Pre-Development — Local Setup Phase

---

## Table of Contents

1. [Vision & Core Idea](#vision--core-idea)
2. [Tech Stack — Pinned Versions](#tech-stack--pinned-versions)
3. [Project Architecture](#project-architecture)
4. [Phase 0 — Local Setup (Current)](#phase-0--local-setup-current)
5. [Phase 1 — Foundation (Auth + DB + Corsair)](#phase-1--foundation-auth--db--corsair)
6. [Phase 2 — Gmail Integration](#phase-2--gmail-integration)
7. [Phase 3 — Calendar Integration](#phase-3--calendar-integration)
8. [Phase 4 — Daily Brief UI (The Core Product)](#phase-4--daily-brief-ui-the-core-product)
9. [Phase 5 — One-Click Calendar Invite from Email](#phase-5--one-click-calendar-invite-from-email)
10. [Phase 6 — Bonus Features (Post-Core)](#phase-6--bonus-features-post-core)
11. [File & Folder Structure](#file--folder-structure)
12. [Database Schema Design](#database-schema-design)
13. [Real-Time Architecture (SSE)](#real-time-architecture-sse)
14. [Corsair Integration Strategy](#corsair-integration-strategy)
15. [Environment Variables](#environment-variables)

---

## Vision & Core Idea

Supereye is a **unified daily command center** that merges Gmail and Google Calendar into a single, real-time view. The key insight: emails and meetings are not separate — a meeting comes from an email, a follow-up email comes from a meeting. Supereye treats them as one connected stream.

### The Killer Feature
**One-click calendar invite from an email thread.** Select an email → click "Schedule" → the event is pre-filled with email context (participants, subject, body summary). No tab-switching, no copy-pasting.

### What Makes It Different
- **Unified View:** Inbox on the left, schedule on the right, both updating in real-time
- **Context Preservation:** Emails and calendar events are linked — see the email thread that spawned a meeting
- **Self-Hosted:** Runs on your own infrastructure, your data stays yours
- **Powered by Corsair:** OAuth, token refresh, webhooks, and API complexity handled by Corsair's integration layer

---

## Tech Stack — Pinned Versions

> ⚠️ **Rule: No assumptions.** Every version below was researched as of June 2026. You (the developer) will install these and I will verify the actual installed versions.

| Technology | Package | Target Version | Role |
|---|---|---|---|
| **Framework** | `next` | `16.2.6` ✅ (already installed) | App Router, API routes, RSC |
| **React** | `react` / `react-dom` | `19.2.4` ✅ (already installed) | UI rendering |
| **TypeScript** | `typescript` | `^5` ✅ (already installed) | Type safety |
| **Styling** | `tailwindcss` | `^4` ✅ (already installed) | Utility CSS |
| **UI Components** | `shadcn` (CLI v4) | `^4.11.0` ✅ (already installed) | Radix-based components |
| **Database** | PostgreSQL 17 | `postgres:17-alpine` Docker image | Persistent storage |
| **ORM** | `drizzle-orm` | Latest (1.x stable) | Schema, queries, migrations |
| **ORM Toolkit** | `drizzle-kit` | Latest | Migration generation & push |
| **PG Driver** | `pg` | Latest | Node.js PostgreSQL driver |
| **Auth** | `next-auth` | `v5` (beta/latest) | Google OAuth, session management |
| **Auth Adapter** | `@auth/drizzle-adapter` | Latest | Bridge NextAuth ↔ Drizzle |
| **Data Fetching** | `@tanstack/react-query` | `^5.101.0` | Client-side cache, mutations |
| **Integration Layer** | `corsair` | Latest | Gmail + Calendar OAuth, webhooks, API |
| **Icons** | `lucide-react` | `^1.17.0` ✅ (already installed) | Icon library |
| **Themes** | `next-themes` | `^0.4.6` ✅ (already installed) | Dark/light mode |
| **Date Handling** | `date-fns` | Latest | Date formatting & math |

### Already Installed (from `package.json`)
- `next@16.2.6`, `react@19.2.4`, `tailwindcss@4`, `shadcn@4.11.0`
- `lucide-react`, `next-themes`, `clsx`, `tailwind-merge`, `class-variance-authority`
- `eslint`, `prettier`, Tailwind PostCSS plugin

### To Be Installed by You
```bash
# Core dependencies
npm install drizzle-orm pg corsair next-auth@beta @auth/drizzle-adapter @tanstack/react-query date-fns

# Dev dependencies
npm install -D drizzle-kit @types/pg
```

After you install these, I will run `npm list` to verify exact versions.

---

## Project Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Daily Brief UI (React 19)               │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  Inbox View  │  │ Calendar View│  │  Quick Act │  │   │
│  │  │  (TanStack)  │  │  (TanStack)  │  │   Panel    │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │   │
│  │         │                 │                │         │   │
│  │         └────────┬────────┘                │         │   │
│  │                  │                         │         │   │
│  │         ┌────────▼──────────┐    ┌─────────▼──────┐  │   │
│  │         │   EventSource     │    │  Server Actions │  │   │
│  │         │   (SSE Client)    │    │  (Mutations)    │  │   │
│  │         └────────┬──────────┘    └─────────┬──────┘  │   │
│  └──────────────────┼────────────────────────┼──────────┘   │
│                     │                        │              │
├─────────────────────┼────────────────────────┼──────────────┤
│                 NEXT.JS SERVER                              │
│  ┌──────────────────┼────────────────────────┼──────────┐   │
│  │                  │                        │          │   │
│  │  ┌───────────────▼──┐    ┌────────────────▼───────┐  │   │
│  │  │  SSE Route       │    │  API Routes            │  │   │
│  │  │  /api/events/sse │    │  /api/mail/*           │  │   │
│  │  └───────┬──────────┘    │  /api/calendar/*       │  │   │
│  │          │               │  /api/auth/*           │  │   │
│  │          │               └────────────┬───────────┘  │   │
│  │          │                            │              │   │
│  │  ┌───────▼────────────────────────────▼───────────┐  │   │
│  │  │            Corsair Integration Layer           │  │   │
│  │  │  ┌──────────┐  ┌───────────────┐  ┌─────────┐ │  │   │
│  │  │  │  Gmail   │  │ Google Calendar│  │Webhooks │ │  │   │
│  │  │  │  Plugin  │  │    Plugin      │  │ Handler │ │  │   │
│  │  │  └──────────┘  └───────────────┘  └─────────┘ │  │   │
│  │  └────────────────────────┬───────────────────────┘  │   │
│  │                           │                          │   │
│  │  ┌────────────────────────▼───────────────────────┐  │   │
│  │  │          Drizzle ORM + PostgreSQL 17           │  │   │
│  │  │  ┌────────┐ ┌────────┐ ┌──────┐ ┌──────────┐  │  │   │
│  │  │  │ Users  │ │ Emails │ │Events│ │ Sessions │  │  │   │
│  │  │  └────────┘ └────────┘ └──────┘ └──────────┘  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 0 — Local Setup (Current)

> **Goal:** Get the development environment fully functional before writing any production code.

### 0.1 Prerequisites Checklist
- [ ] Node.js 22+ (LTS) installed
- [ ] Docker Desktop installed and running
- [ ] Git configured
- [ ] Google Cloud Console project created (for OAuth credentials)

### 0.2 PostgreSQL 17 — Local Docker Setup

Create a `docker-compose.dev.yml` at the project root (**dev only**, not production):

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: supereye-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: supereye
      POSTGRES_PASSWORD: supereye_dev_password
      POSTGRES_DB: supereye
    ports:
      - "5432:5432"
    volumes:
      - supereye-pgdata:/var/lib/postgresql/data

volumes:
  supereye-pgdata:
```

**Commands:**
```bash
# Start PostgreSQL
docker compose -f docker-compose.dev.yml up -d

# Verify it's running
docker compose -f docker-compose.dev.yml ps

# Connect with psql (optional, for verification)
docker exec -it supereye-db psql -U supereye -d supereye

# Stop PostgreSQL
docker compose -f docker-compose.dev.yml down

# Stop and destroy data
docker compose -f docker-compose.dev.yml down -v
```

### 0.3 Install Dependencies

**You will install these:**
```bash
# Core runtime dependencies
npm install drizzle-orm pg corsair next-auth@beta @auth/drizzle-adapter @tanstack/react-query date-fns

# Dev dependencies
npm install -D drizzle-kit @types/pg
```

**After installation, I will verify versions by running:**
```bash
npm list drizzle-orm pg corsair next-auth @auth/drizzle-adapter @tanstack/react-query date-fns drizzle-kit
```

### 0.4 Environment Variables

Create `.env.local` (never committed):

```env
# ─── Database ───
DATABASE_URL=postgresql://supereye:supereye_dev_password@localhost:5432/supereye

# ─── NextAuth ───
AUTH_SECRET=  # Generate with: npx auth secret
AUTH_GOOGLE_ID=  # From Google Cloud Console
AUTH_GOOGLE_SECRET=  # From Google Cloud Console

# ─── Corsair ───
CORSAIR_KEK=  # Key Encryption Key — generate a random 32-char string

# ─── App ───
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 0.5 Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project called "Supereye"
3. Enable these APIs:
   - Gmail API
   - Google Calendar API
4. Go to **APIs & Services → Credentials**
5. Create an **OAuth 2.0 Client ID** (Web application)
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret into `.env.local`
8. Configure the **OAuth Consent Screen** (External, test mode)
9. Add scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/calendar`

### 0.6 Drizzle Configuration

Create `drizzle.config.ts` at the project root:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 0.7 Gitignore Updates

Ensure `.gitignore` includes:
```
# Environment
.env
.env.local
.env.*.local

# Database
postgres-data/

# Drizzle
drizzle/meta/

# Docker
docker-compose.override.yml
```

---

## Phase 1 — Foundation (Auth + DB + Corsair)

> **Goal:** User can sign in with Google, session is stored in Postgres, Corsair is initialized.

### 1.1 Database Schema (Drizzle)

**File: `lib/db/schema.ts`**

Tables needed:
- `users` — NextAuth user table
- `accounts` — NextAuth OAuth accounts (stores Google tokens)
- `sessions` — NextAuth sessions
- `verificationTokens` — NextAuth email verification
- `emails` — Cached Gmail messages
- `calendarEvents` — Cached calendar events
- `emailEventLinks` — Junction table linking emails to calendar events

### 1.2 Database Connection

**File: `lib/db/index.ts`**

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

### 1.3 NextAuth v5 Setup

**File: `auth.ts`** (project root)

```typescript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    // Store access_token and refresh_token in the session
  },
});
```

**File: `app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```

### 1.4 Corsair Initialization

**File: `lib/corsair.ts`**

```typescript
import { createCorsair, gmail, googlecalendar } from 'corsair';
import { db } from '@/lib/db';

export const corsair = createCorsair({
  plugins: [gmail(), googlecalendar()],
  database: db,
  kek: process.env.CORSAIR_KEK!,
});
```

> **Note:** You (the developer) will handle the basic Corsair integration with Gmail, GitHub, and Calendar first. From your working code, I'll understand the patterns and build the main features and UI.

### 1.5 Middleware (Route Protection)

**File: `middleware.ts`**

```typescript
export { auth as middleware } from '@/auth';

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
```

### 1.6 Verification
- [ ] User can click "Sign in with Google"
- [ ] Google OAuth flow completes, user redirected back
- [ ] User record created in `users` table
- [ ] Access and refresh tokens stored in `accounts` table
- [ ] Session persisted in `sessions` table
- [ ] Protected routes redirect to login when unauthenticated

---

## Phase 2 — Gmail Integration

> **Goal:** Fetch, cache, display, and act on emails from the user's Gmail inbox.

### 2.1 Data Flow
```
Gmail API (via Corsair) → Webhook → API Route → Postgres Cache → TanStack Query → UI
```

### 2.2 Features
- **Fetch Inbox:** Pull latest emails on login & on demand
- **Cache Locally:** Store email metadata + body in Postgres
- **Real-Time Updates:** Corsair webhook fires on new email → SSE pushes to browser → TanStack invalidates cache
- **Actions:** Reply, Archive, Star, Mark Read/Unread — all via Corsair API
- **Incremental Sync:** Use Gmail's `historyId` to only fetch what changed

### 2.3 Email Schema Fields
```
id, googleMessageId, threadId, userId,
from, to, cc, bcc, subject, snippet, body,
labelIds, isRead, isStarred, isArchived,
internalDate, receivedAt, syncedAt
```

### 2.4 API Routes
| Route | Method | Purpose |
|---|---|---|
| `/api/mail/inbox` | GET | Fetch paginated inbox |
| `/api/mail/thread/[threadId]` | GET | Fetch full thread |
| `/api/mail/[messageId]/read` | POST | Mark as read |
| `/api/mail/[messageId]/star` | POST | Toggle star |
| `/api/mail/[messageId]/archive` | POST | Archive |
| `/api/mail/[messageId]/reply` | POST | Send reply |
| `/api/mail/sync` | POST | Trigger full sync |

### 2.5 Webhook Handler
| Route | Method | Purpose |
|---|---|---|
| `/api/webhooks/gmail` | POST | Receive Gmail push notifications from Corsair |

---

## Phase 3 — Calendar Integration

> **Goal:** Fetch, cache, display, and manage calendar events.

### 3.1 Features
- **Fetch Events:** Pull today + tomorrow (and upcoming week) on login
- **Cache Locally:** Store event metadata in Postgres
- **Real-Time Updates:** Corsair webhook fires on event change → SSE → UI update
- **Actions:** Create, Edit, Delete events via Corsair API
- **Create from Email:** Pre-fill event details from email context (Phase 5)

### 3.2 Calendar Event Schema Fields
```
id, googleEventId, userId, calendarId,
title, description, location,
startTime, endTime, isAllDay,
status (confirmed/tentative/cancelled),
attendees (JSON), organizer,
htmlLink, sourceEmailId (nullable FK),
syncedAt
```

### 3.3 API Routes
| Route | Method | Purpose |
|---|---|---|
| `/api/calendar/events` | GET | Fetch events (date range query) |
| `/api/calendar/events` | POST | Create new event |
| `/api/calendar/events/[eventId]` | PUT | Update event |
| `/api/calendar/events/[eventId]` | DELETE | Delete event |
| `/api/calendar/sync` | POST | Trigger full sync |

### 3.4 Webhook Handler
| Route | Method | Purpose |
|---|---|---|
| `/api/webhooks/calendar` | POST | Receive Calendar push notifications from Corsair |

---

## Phase 4 — Daily Brief UI (The Core Product)

> **Goal:** Build the unified view that makes Supereye more than a Gmail clone.

### 4.1 Layout

```
┌────────────────────────────────────────────────────────────┐
│  [Supereye Logo]    [Search]    [Notifications]  [Avatar]  │
├──────────────────────────┬─────────────────────────────────┤
│                          │                                 │
│     PRIORITIZED INBOX    │       TODAY'S SCHEDULE           │
│                          │                                 │
│  ┌────────────────────┐  │  ┌───────────────────────────┐  │
│  │ ★ From: John       │  │  │  09:00  Team Standup     │  │
│  │   Re: Q3 Planning  │  │  │         30 min            │  │
│  │   "Let's discuss..." │  │  │  🔗 linked to email #42 │  │
│  │   [Reply] [Schedule]│  │  ├───────────────────────────┤  │
│  ├────────────────────┤  │  │  11:00  Design Review     │  │
│  │   From: Sarah      │  │  │         1 hr              │  │
│  │   Budget Review    │  │  ├───────────────────────────┤  │
│  │   "Attached is..." │  │  │  14:00  1:1 with Manager  │  │
│  │   [Reply] [Archive]│  │  │         30 min            │  │
│  ├────────────────────┤  │  └───────────────────────────┘  │
│  │   From: GitHub     │  │                                 │
│  │   PR #127 merged   │  │       TOMORROW                  │
│  │   "Your PR was..." │  │  ┌───────────────────────────┐  │
│  │   [Archive]        │  │  │  10:00  Sprint Planning    │  │
│  └────────────────────┘  │  │         2 hr               │  │
│                          │  └───────────────────────────┘  │
│  [Load More]             │                                 │
├──────────────────────────┴─────────────────────────────────┤
│  ⌘K Quick Actions    │  Status: Connected ●                │
└────────────────────────────────────────────────────────────┘
```

### 4.2 UI Components Needed
| Component | Purpose |
|---|---|
| `DailyBrief` | Main layout — split view container |
| `InboxPanel` | Left side — email list with actions |
| `EmailCard` | Individual email summary with quick actions |
| `EmailThread` | Expanded email thread view (modal/slide-over) |
| `SchedulePanel` | Right side — today + tomorrow timeline |
| `EventCard` | Individual calendar event with time + link |
| `QuickActions` | ⌘K command palette for power users |
| `ComposeReply` | Inline reply composer |
| `CreateEvent` | Event creation form (used by Phase 5) |
| `StatusBar` | Bottom bar showing connection status |

### 4.3 Client-Side State
- TanStack Query for inbox data (`useInbox`, `useThread`)
- TanStack Query for calendar data (`useEvents`, `useTodayEvents`)
- SSE EventSource for real-time invalidation
- React state for UI interactions (selected email, panel visibility)

### 4.4 Design Direction
- **Dark mode first** (with light mode toggle)
- **Glass-morphism** accents on cards and panels
- **Smooth animations** — email list transitions, panel slide-ins
- **Premium feel** — Inter/Geist font, subtle gradients, micro-interactions
- **Responsive** — works on desktop (primary) and tablet

---

## Phase 5 — One-Click Calendar Invite from Email

> **Goal:** The killer feature that makes the email→meeting workflow seamless.

### 5.1 Flow
1. User reads an email thread
2. Clicks **"Schedule Meeting"** button on the email
3. A pre-filled event creation form appears with:
   - **Title:** Email subject
   - **Description:** Email body snippet + link to thread
   - **Attendees:** Email participants (from, to, cc)
   - **Suggested Time:** Next available 30-min slot from calendar
4. User tweaks and confirms
5. Event is created via Corsair Calendar API
6. `emailEventLinks` junction table records the connection
7. Both the email card and event card show a 🔗 link to each other

### 5.2 Smart Defaults
- Parse email for time mentions ("let's meet at 3pm", "how about Thursday")
- Suggest available slots that don't conflict with existing events
- Default duration: 30 minutes (configurable)

### 5.3 API Route
| Route | Method | Purpose |
|---|---|---|
| `/api/calendar/from-email` | POST | Create event pre-filled from email data |

---

## Phase 6 — Bonus Features (Post-Core)

> **Not in scope for the initial build. Documented for future reference.**

- [ ] **AI Email Priority Tagging** — Use LLM to categorize emails (urgent, FYI, action required)
- [ ] **Keyboard Shortcuts** — Vim-style navigation (j/k for up/down, r for reply, a for archive)
- [ ] **Agent Chat via Corsair MCP** — Chat with an AI that can read emails and create events
- [ ] **Fast Local Search** — pgvector for semantic search across emails and events
- [ ] **Email Snooze** — Hide email until a specified time
- [ ] **Unified Notification Stream** — Merge email and calendar notifications
- [ ] **Multi-Account Support** — Connect multiple Google accounts

---

## File & Folder Structure

```
supereye/
├── app/
│   ├── layout.tsx              # Root layout (providers, fonts, theme)
│   ├── page.tsx                # Landing/redirect to dashboard
│   ├── globals.css             # Tailwind + custom styles
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   └── layout.tsx          # Auth layout (centered, no sidebar)
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Dashboard layout (navbar, sidebar)
│   │   ├── page.tsx            # Daily Brief (main screen)
│   │   ├── inbox/
│   │   │   └── page.tsx        # Full inbox view
│   │   ├── calendar/
│   │   │   └── page.tsx        # Full calendar view
│   │   └── settings/
│   │       └── page.tsx        # User settings
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts    # NextAuth route handler
│       ├── mail/
│       │   ├── inbox/
│       │   │   └── route.ts    # GET: Fetch inbox
│       │   ├── thread/
│       │   │   └── [threadId]/
│       │   │       └── route.ts # GET: Fetch thread
│       │   ├── [messageId]/
│       │   │   ├── read/
│       │   │   │   └── route.ts # POST: Mark read
│       │   │   ├── star/
│       │   │   │   └── route.ts # POST: Toggle star
│       │   │   ├── archive/
│       │   │   │   └── route.ts # POST: Archive
│       │   │   └── reply/
│       │   │       └── route.ts # POST: Send reply
│       │   └── sync/
│       │       └── route.ts    # POST: Trigger sync
│       ├── calendar/
│       │   ├── events/
│       │   │   ├── route.ts    # GET/POST: List/Create events
│       │   │   └── [eventId]/
│       │   │       └── route.ts # PUT/DELETE: Update/Delete
│       │   ├── from-email/
│       │   │   └── route.ts    # POST: Create from email
│       │   └── sync/
│       │       └── route.ts    # POST: Trigger sync
│       ├── webhooks/
│       │   ├── gmail/
│       │   │   └── route.ts    # POST: Gmail webhook
│       │   └── calendar/
│       │       └── route.ts    # POST: Calendar webhook
│       └── events/
│           └── sse/
│               └── route.ts    # GET: SSE stream endpoint
├── components/
│   ├── ui/                     # shadcn/ui components (auto-generated)
│   ├── theme-provider.tsx      # Already exists
│   ├── daily-brief/
│   │   ├── daily-brief.tsx     # Main split-view container
│   │   ├── inbox-panel.tsx     # Left side inbox
│   │   ├── schedule-panel.tsx  # Right side calendar
│   │   └── status-bar.tsx      # Connection status
│   ├── email/
│   │   ├── email-card.tsx      # Email list item
│   │   ├── email-thread.tsx    # Expanded thread view
│   │   ├── compose-reply.tsx   # Reply composer
│   │   └── email-actions.tsx   # Action buttons (reply, archive, star)
│   ├── calendar/
│   │   ├── event-card.tsx      # Calendar event item
│   │   ├── create-event.tsx    # Event creation form
│   │   ├── time-slot.tsx       # Time slot picker
│   │   └── day-timeline.tsx    # Vertical timeline for a day
│   ├── auth/
│   │   ├── sign-in-button.tsx  # Google sign-in button
│   │   └── user-menu.tsx       # Avatar dropdown
│   └── shared/
│       ├── navbar.tsx          # Top navigation bar
│       ├── command-palette.tsx # ⌘K quick actions
│       └── loading.tsx         # Skeleton loaders
├── lib/
│   ├── utils.ts                # Already exists (cn utility)
│   ├── db/
│   │   ├── index.ts            # Drizzle instance
│   │   └── schema.ts           # All table definitions
│   ├── corsair.ts              # Corsair initialization
│   ├── auth/
│   │   └── helpers.ts          # Auth utility functions
│   ├── mail/
│   │   ├── sync.ts             # Gmail sync logic
│   │   └── actions.ts          # Server actions for email ops
│   ├── calendar/
│   │   ├── sync.ts             # Calendar sync logic
│   │   └── actions.ts          # Server actions for calendar ops
│   └── sse/
│       └── emitter.ts          # SSE event emitter (shared state)
├── hooks/
│   ├── use-inbox.ts            # TanStack Query hook for inbox
│   ├── use-thread.ts           # TanStack Query hook for thread
│   ├── use-events.ts           # TanStack Query hook for events
│   ├── use-sse.ts              # SSE connection hook
│   └── use-create-event-from-email.ts  # Mutation hook
├── auth.ts                     # NextAuth v5 config (root)
├── middleware.ts               # Route protection
├── drizzle.config.ts           # Drizzle Kit config
├── docker-compose.dev.yml      # Dev Postgres only
├── .env.local                  # Environment variables (not committed)
└── SUPEREYE_PLAN.md            # This file
```

---

## Database Schema Design

### Core Tables

```sql
-- NextAuth tables (managed by @auth/drizzle-adapter)
users (id, name, email, emailVerified, image)
accounts (id, userId, type, provider, providerAccountId, access_token, refresh_token, ...)
sessions (id, sessionToken, userId, expires)
verificationTokens (identifier, token, expires)

-- Application tables
emails (
  id UUID PK,
  user_id FK → users.id,
  google_message_id TEXT UNIQUE,
  thread_id TEXT,
  from_address TEXT,
  from_name TEXT,
  to_addresses JSONB,
  cc_addresses JSONB,
  subject TEXT,
  snippet TEXT,
  body TEXT,
  label_ids JSONB,
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  internal_date TIMESTAMP,
  history_id TEXT,
  synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

calendar_events (
  id UUID PK,
  user_id FK → users.id,
  google_event_id TEXT UNIQUE,
  calendar_id TEXT DEFAULT 'primary',
  title TEXT,
  description TEXT,
  location TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  is_all_day BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'confirmed',
  attendees JSONB,
  organizer JSONB,
  html_link TEXT,
  source_email_id FK → emails.id NULLABLE,
  synced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

email_event_links (
  id UUID PK,
  email_id FK → emails.id,
  event_id FK → calendar_events.id,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(email_id, event_id)
)

sync_state (
  id UUID PK,
  user_id FK → users.id,
  provider TEXT, -- 'gmail' | 'calendar'
  last_sync_token TEXT, -- historyId for Gmail, syncToken for Calendar
  last_synced_at TIMESTAMP,
  UNIQUE(user_id, provider)
)
```

### Indexes
```sql
CREATE INDEX idx_emails_user_id ON emails(user_id);
CREATE INDEX idx_emails_thread_id ON emails(thread_id);
CREATE INDEX idx_emails_internal_date ON emails(internal_date DESC);
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_source_email ON calendar_events(source_email_id);
```

---

## Real-Time Architecture (SSE)

### How It Works

```
Corsair Webhook → API Route → Process & Cache → SSE Emitter → Browser EventSource
```

1. **Corsair fires a webhook** when an email arrives or calendar event changes
2. **Webhook handler** (`/api/webhooks/gmail` or `/api/webhooks/calendar`) processes the notification
3. **Sync logic** fetches changed data from Gmail/Calendar API and updates Postgres
4. **SSE emitter** broadcasts an event to all connected clients for that user
5. **Browser EventSource** receives the event and **invalidates TanStack Query cache**
6. **TanStack Query** automatically refetches the stale data from our API routes

### SSE Route (`/api/events/sse`)

```typescript
// Simplified pattern
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Subscribe to events for this user
      const unsubscribe = eventEmitter.on(session.user.id, (event) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      });

      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Client Hook (`hooks/use-sse.ts`)

```typescript
// Simplified pattern
export function useSSE() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource('/api/events/sse');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'email:new' || data.type === 'email:updated') {
        queryClient.invalidateQueries({ queryKey: ['inbox'] });
      }
      if (data.type === 'calendar:updated') {
        queryClient.invalidateQueries({ queryKey: ['events'] });
      }
    };

    return () => eventSource.close();
  }, [queryClient]);
}
```

---

## Corsair Integration Strategy

### Your Part (Developer)
You will set up the basic Corsair integration with:
1. Gmail plugin — basic read/send
2. Google Calendar plugin — basic CRUD
3. GitHub plugin (if needed)

This gives me the patterns for how Corsair's API works in this codebase.

### My Part (Agent)
After seeing your Corsair integration code, I will build:
1. Full Gmail sync pipeline (incremental via historyId)
2. Full Calendar sync pipeline (incremental via syncToken)
3. Webhook handlers for real-time updates
4. SSE broadcasting layer
5. All API routes that leverage Corsair
6. All UI components and pages

### Corsair Core Patterns (Expected)

```typescript
// Reading emails
const emails = await corsair.gmail.messages.list(userId, { maxResults: 20 });

// Sending a reply
await corsair.gmail.messages.send(userId, {
  threadId: '...',
  to: '...',
  body: '...',
});

// Creating a calendar event
await corsair.googlecalendar.events.create(userId, {
  calendarId: 'primary',
  summary: '...',
  start: { dateTime: '...' },
  end: { dateTime: '...' },
  attendees: [{ email: '...' }],
});

// Webhook registration
await corsair.webhooks.register({
  plugin: 'gmail',
  userId,
  url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/gmail`,
});
```

> **Note:** These are expected patterns based on research. The actual API surface may differ — we'll adapt based on your initial Corsair integration code and the Corsair docs.

---

## Environment Variables

### Complete `.env.local` Template

```env
# ─── Database ─────────────────────────────
DATABASE_URL=postgresql://supereye:supereye_dev_password@localhost:5432/supereye

# ─── NextAuth v5 ──────────────────────────
AUTH_SECRET=                    # npx auth secret
AUTH_GOOGLE_ID=                 # Google Cloud Console OAuth Client ID
AUTH_GOOGLE_SECRET=             # Google Cloud Console OAuth Client Secret
AUTH_TRUST_HOST=true            # For local dev

# ─── Corsair ──────────────────────────────
CORSAIR_KEK=                   # 32-char random key for credential encryption

# ─── Application ──────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Current Status & Next Steps

### ✅ Done
- [x] Next.js 16.2.6 project created with App Router
- [x] React 19.2.4 installed
- [x] Tailwind CSS v4 configured
- [x] shadcn/ui CLI v4 initialized (radix-vega style)
- [x] ESLint + Prettier configured
- [x] Git repository initialized
- [x] This plan document created

### 🔜 Next (Phase 0 — You)
- [ ] Install Docker Desktop (if not already)
- [ ] Create `docker-compose.dev.yml` → start PostgreSQL 17
- [ ] Install npm dependencies (listed above)
- [ ] Set up Google Cloud Console project & OAuth credentials
- [ ] Create `.env.local` with all variables
- [ ] Do basic Corsair integration with Gmail + Calendar
- [ ] Share your Corsair integration code with me

### 🔜 Next (Phase 0 — Me)
- [ ] Verify all installed package versions
- [ ] Create `drizzle.config.ts`
- [ ] Create database schema (`lib/db/schema.ts`)
- [ ] Create database connection (`lib/db/index.ts`)
- [ ] Set up NextAuth v5 with Drizzle adapter
- [ ] Create initial migration and push schema
- [ ] Build the auth flow (login page, middleware, session)

---

> **Remember:** No production code (GitHub Actions, production Docker Compose, Caddy config) until the core features are built and working locally.
