# CORSAIR PRODUCTIVITY OS — Complete UI/UX Design Specification
### A Superhuman-Style Gmail × Google Calendar × AI Agent App
**Stack:** Next.js · Postgres · Corsair API · Tailwind CSS · Framer Motion  
**Version:** 1.0 | Author: Design Spec for Hackathon Build

---

## TABLE OF CONTENTS

1. [Project Vision & Philosophy](#1-project-vision--philosophy)
2. [Design System — Tokens, Typography, Colors](#2-design-system)
3. [App Shell & Tab Navigation](#3-app-shell--tab-navigation)
4. [AI Chat View (GPT-style)](#4-ai-chat-view)
5. [Email View — Complete Redesign](#5-email-view)
6. [Calendar View — Full Featured](#6-calendar-view)
7. [Split View System](#7-split-view-system)
8. [Command Palette (⌘K)](#8-command-palette)
9. [Keyboard Shortcut System](#9-keyboard-shortcut-system)
10. [Notifications & Real-Time Panel](#10-notifications--real-time-panel)
11. [Settings & Preferences](#11-settings--preferences)
12. [Authentication & Onboarding](#12-authentication--onboarding)
13. [AI Feature Inventory](#13-ai-feature-inventory)
14. [Component Library Reference](#14-component-library-reference)
15. [Page-by-Page Implementation Checklist](#15-page-by-page-implementation-checklist)

---

## 1. PROJECT VISION & PHILOSOPHY

### The Problem
Gmail and Google Calendar were built for the masses. Power users deal with decision fatigue caused by cluttered UIs, buried actions, too many clicks, and zero AI assistance in the actual workflow.

### The Solution
**Corsair Productivity OS** — a keyboard-first, AI-native productivity shell that wraps Gmail and Google Calendar in a unified, opinionated interface. The user never leaves the app. Everything is one keypress away.

### Design Principles
| Principle | Meaning |
|---|---|
| **Zero Friction** | Every common action is ≤2 clicks or 1 keyboard shortcut |
| **Context Awareness** | AI understands current email/event context at all times |
| **Information Density** | Show more, scroll less — inspired by Superhuman, Linear, Raycast |
| **Dark-First** | Dark mode is the primary design; light mode is equally polished |
| **Progressive Disclosure** | Advanced features are available but never in the way |

---

## 2. DESIGN SYSTEM

### 2.1 Typography

**Primary Font: `Inter`** — UI labels, body text, email content  
**Display Font: `Geist`** — headings, tab labels, modal titles  
**Monospace Font: `JetBrains Mono`** — keyboard shortcuts, code blocks, timestamps  

```css
/* Font Scale */
--text-xs:    11px / line-height: 16px
--text-sm:    13px / line-height: 20px
--text-base:  14px / line-height: 22px
--text-md:    15px / line-height: 24px
--text-lg:    17px / line-height: 26px
--text-xl:    20px / line-height: 30px
--text-2xl:   24px / line-height: 34px
--text-3xl:   30px / line-height: 40px

/* Font Weights */
--font-regular:  400
--font-medium:   500
--font-semibold: 600
--font-bold:     700
```

---

### 2.2 Color System

#### DARK MODE (Default)

```css
/* === BACKGROUNDS === */
--bg-app:          #0C0D0F;   /* App root background */
--bg-base:         #111316;   /* Panel backgrounds */
--bg-surface:      #181B1F;   /* Card, sidebar bg */
--bg-elevated:     #1F2226;   /* Dropdowns, modals */
--bg-overlay:      #252A30;   /* Hover states, tooltips */
--bg-highlight:    #2A2F38;   /* Selected row, active item */

/* === BORDERS === */
--border-subtle:   #1E2228;   /* Dividers, ghost borders */
--border-default:  #272C34;   /* Input borders, card edges */
--border-strong:   #363D47;   /* Focus rings */

/* === TEXT === */
--text-primary:    #F2F4F7;   /* Main body text */
--text-secondary:  #8D95A0;   /* Labels, metadata */
--text-muted:      #535C68;   /* Placeholder, disabled */
--text-inverse:    #0C0D0F;   /* Text on light surfaces */

/* === BRAND / ACCENT === */
--accent-blue:     #3B82F6;   /* Primary CTA, links */
--accent-blue-dim: #1D4ED8;   /* Hover on blue */
--accent-blue-glow:#3B82F620; /* Blue glow bg */

/* === SEMANTIC COLORS === */
--color-success:   #22C55E;   /* Sent, confirmed */
--color-warning:   #F59E0B;   /* Pending, tentative */
--color-error:     #EF4444;   /* Failed, urgent */
--color-info:      #6366F1;   /* AI suggestions */
--color-purple:    #A855F7;   /* Premium/AI tag */

/* === PRIORITY COLORS (AI Email Triage) === */
--priority-urgent: #EF4444;   /* Needs immediate response */
--priority-high:   #F97316;   /* Important, respond today */
--priority-medium: #EAB308;   /* Normal priority */
--priority-low:    #64748B;   /* FYI / newsletters */
--priority-ai:     #8B5CF6;   /* AI-drafted reply */

/* === EMAIL STATUS DOTS === */
--dot-unread:      #3B82F6;
--dot-read:        transparent;
--dot-starred:     #F59E0B;
--dot-snoozed:     #8B5CF6;

/* === CALENDAR COLORS === */
--cal-personal:    #EF4444;
--cal-work:        #3B82F6;
--cal-family:      #22C55E;
--cal-holiday:     #10B981;
--cal-birthday:    #F59E0B;
--cal-focus:       #8B5CF6;
```

#### LIGHT MODE

```css
/* === BACKGROUNDS === */
--bg-app:          #F8F9FB;
--bg-base:         #FFFFFF;
--bg-surface:      #F3F4F6;
--bg-elevated:     #FFFFFF;
--bg-overlay:      #F0F1F3;
--bg-highlight:    #EBF3FF;

/* === BORDERS === */
--border-subtle:   #EBEDF0;
--border-default:  #D1D5DB;
--border-strong:   #9CA3AF;

/* === TEXT === */
--text-primary:    #0F1117;
--text-secondary:  #4B5563;
--text-muted:      #9CA3AF;
--text-inverse:    #FFFFFF;

/* All accent/semantic colors remain identical across modes */
```

---

### 2.3 Spacing System

```css
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  20px
--space-6:  24px
--space-8:  32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

### 2.4 Border Radius

```css
--radius-sm:  4px   /* Tags, badges */
--radius-md:  8px   /* Cards, inputs */
--radius-lg:  12px  /* Modals, panels */
--radius-xl:  16px  /* Large cards */
--radius-2xl: 20px  /* Floating chat bubbles */
--radius-full: 9999px /* Pills, avatar circles */
```

### 2.5 Shadows (Dark Mode)

```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.4);
--shadow-md:  0 4px 12px rgba(0,0,0,0.5);
--shadow-lg:  0 8px 24px rgba(0,0,0,0.6);
--shadow-xl:  0 16px 48px rgba(0,0,0,0.7);
--shadow-glow-blue: 0 0 20px rgba(59,130,246,0.25);
```

### 2.6 Motion & Animation

```css
--transition-fast:   100ms ease
--transition-base:   200ms ease
--transition-slow:   350ms cubic-bezier(0.16, 1, 0.3, 1)
--transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

- Tab switches: **slide + fade, 200ms**
- Modal open: **scale(0.97) → scale(1) + fade, 250ms**
- Email row hover: **background transition, 100ms**
- Chat message appear: **translateY(8px) → 0 + fade, 180ms**
- Split panel resize: **no animation (instant for snappiness)**
- Sidebar collapse: **width transition, 300ms spring**

---

## 3. APP SHELL & TAB NAVIGATION

### 3.1 Overall App Structure

```
┌────────────────────────────────────────────────────────┐
│  TOP BAR (48px height, sticky)                         │
│  [Logo] [Chat] [Email] [Calendar] ··· [Account] [⚙]   │
├──────────────────────────────────────────────────────  │
│                                                        │
│  MAIN CONTENT AREA (flex, dynamic based on active tabs)│
│                                                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  CHAT PANE  │  │  EMAIL PANE  │  │  CAL PANE    │  │
│  │  (visible   │  │  (visible    │  │  (visible    │  │
│  │   if active)│  │   if active) │  │   if active) │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 3.2 Top Tab Bar — Full Specification

**Height:** 48px  
**Background:** `--bg-base` with 1px bottom border in `--border-subtle`  
**Sticky:** Always visible, never scrolls away  
**Backdrop blur:** `backdrop-filter: blur(12px)` on scroll  

#### Left Section (Logo + App Name)
```
[⚡ Corsair]  ← 28px icon + "Corsair" in Geist 600 16px
```
- Logo: A lightning bolt or custom mark — 28×28px, colored `--accent-blue`
- App name: `Geist SemiBold 15px`, `--text-primary`
- Clickable — navigates to default view (Chat)

#### Center Section (Navigation Tabs)
```
[Chat]  [Email]  [Calendar]
```

**Tab Design:**
- Font: `Inter Medium 13.5px`
- Default state: `--text-secondary`, no background
- Hover: `--bg-overlay`, `--text-primary`, `--radius-md` pill shape
- Active (single): Filled pill, `--bg-highlight`, `--text-primary`, blue underline 2px
- Active (multi-selected): Each tab gets a colored dot indicator showing it's in split view

**Tab interaction rules:**
- **Click once** → Open tab as full-width view, close others
- **Click on already-active tab** → Deselect if another is still active (split collapses)
- **Cmd/Ctrl + click** → Add to split view (max 2 panes simultaneously)
- Split indicator: When 2 tabs are active, a small `⬛⬛` split icon appears next to tab labels
- **Tab with unread badge:** `Email` tab shows red dot badge with count (e.g. `Email ●12`)

**Keyboard access:**
- `G + C` → Go to Chat
- `G + E` → Go to Email
- `G + K` → Go to Calendar (mnemonic: Kal)

#### Right Section (Utility Controls)
```
[🔔 Notifications] [⌨ Shortcuts] [🌙/☀ Theme] [👤 Account]
```

**Notification Bell:**
- 24px icon, `--text-secondary`
- Red badge dot when unread notifications
- Click → Dropdown panel (see Section 10)

**Theme Toggle:**
- Moon icon (dark mode) / Sun icon (light mode)
- Click to toggle — updates `data-theme` on `<html>`, triggers CSS variable swap
- 200ms smooth transition on all colors

**Account Avatar:**
- 28px circular avatar with Google account photo
- Hover → shows name tooltip
- Click → Account dropdown:
  - User name + email (read-only display)
  - `Switch Account`
  - `Settings` (⌘,)
  - `Keyboard Shortcuts` (?)
  - `Sign Out`

---

### 3.3 Split View Layout System

When 2 tabs are active simultaneously, the main content area uses:

```
Email + Calendar (50/50 default, resizable via drag handle):
┌──────────────────────┬──│──┬──────────────────────┐
│                      │  ▕  │                      │
│    EMAIL PANE        │  ▕  │   CALENDAR PANE      │
│    (50%)             │  ▕  │   (50%)              │
│                      │  ▕  │                      │
└──────────────────────┴──│──┴──────────────────────┘
                        Drag handle (4px, hover → 8px, color: --accent-blue)
```

**All valid split combinations:**
- Chat + Email
- Chat + Calendar
- Email + Calendar (most common, highlighted in onboarding)

**Split behavior:**
- Minimum pane width: 340px (below this, the view collapses to tabs)
- Drag handle: 4px wide, color `--border-default`, hover → `--accent-blue` glow
- Double-click drag handle → Reset to 50/50
- Pane collapse button (chevron) on each panel's header for quick collapse

---

## 4. AI CHAT VIEW

### 4.1 Layout Overview

```
┌──────────────────────────────────────────────────┐
│  TOP BAR (shared)                                │
├──────────┬───────────────────────────────────────┤
│ HISTORY  │           CHAT CANVAS                 │
│ SIDEBAR  │                                       │
│ (260px)  │   [Assistant messages + User messages]│
│          │                                       │
│ [Threads]│                                       │
│          │                                       │
│ [Search  │                                       │
│  chats]  │                                       │
│          ├───────────────────────────────────────┤
│          │           INPUT AREA                  │
│          │  [⊕][📎] Type a message...  [↑ Send] │
└──────────┴───────────────────────────────────────┘
```

### 4.2 Chat History Sidebar (260px)

**Header:**
- `Chats` — Geist SemiBold 14px
- `[+ New Chat]` button — top right, outlined pill style, `--accent-blue` border and text

**Thread List:**
- Each thread: 40px row
  - Thread icon (small emoji auto-assigned based on topic, 16px)
  - Thread title (auto-generated from first message, truncated at 180px)
  - Timestamp (relative: "2h ago", "Yesterday", "Jun 10")
  - On hover: delete icon (🗑) appears on right
- **Groupings:**
  - Today
  - Yesterday
  - Last 7 Days
  - Last 30 Days
  - [Month Year] for older

**Search bar at top of sidebar:**
- Placeholder: `Search chats...`
- Magnifier icon left
- Keyboard: `Ctrl+F` while in chat focuses this search

**Context chip row (below search, scrollable horizontal):**
```
[📧 With email context] [📅 With calendar] [🤖 Agent mode]
```
- These filter threads to show only chat sessions that had those modes active

### 4.3 Main Chat Canvas

**Message Design:**

*User message:*
```
                              ┌────────────────────────┐
                              │ Send a calendar invite  │  ← right-aligned
                              │ to friend@corsair.dev   │     bubble
                              │ at 9 AM next Thursday   │
                              └────────────────────────┘
                              [👤 Avatar]  11:42 PM
```
- Background: `--accent-blue` (blue fill)
- Text: white `#FFFFFF`
- Border radius: `--radius-2xl` (20px) with sharp bottom-right corner (4px)
- Max width: 72% of canvas width
- Font: Inter Regular 14px

*AI message:*
```
[🤖] Corsair AI                        11:42 PM
┌───────────────────────────────────────────────────┐
│ I've created a calendar invite for Thursday, Jun  │
│ 19 at 9:00 AM for friend@corsair.dev.             │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ 📅  Meeting — Thursday Jun 19, 9:00 AM      │  │
│  │     Inviting: friend@corsair.dev            │  │
│  │     [Confirm & Send] [Edit] [Cancel]        │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│ Also drafting an email. Want me to show it?       │
└───────────────────────────────────────────────────┘
```
- Background: `--bg-surface`
- Border: 1px `--border-default`
- Border radius: `--radius-xl` (16px) with sharp top-left corner
- Max width: 80% of canvas width
- Streaming text: cursor blink animation during generation

**Embedded Action Cards within AI responses:**
Used when the AI has performed or is about to perform an action:

*Email Draft Card:*
```
┌──────────────────────────────────────────────────┐
│ 📧  Draft Email                     [Edit] [Send]│
│ To: friend@corsair.dev                           │
│ Subject: Looking forward to our meeting          │
│ ─────────────────────────────────────────────── │
│ Hi! I wanted to reach out to say I'm looking    │
│ forward to our meeting on Thursday...            │
└──────────────────────────────────────────────────┘
```

*Calendar Event Card:*
```
┌──────────────────────────────────────────────────┐
│ 📅  New Event                     [Edit] [Send]  │
│ Meeting                                          │
│ Thursday, Jun 19 · 9:00 – 10:00 AM              │
│ Guests: friend@corsair.dev                       │
└──────────────────────────────────────────────────┘
```

*Email Summary Card:*
```
┌──────────────────────────────────────────────────┐
│ 📨  Email Summary  ·  3 threads                  │
│ • TCS: AI certification job primer (High)        │
│ • Tally: New formula editor (Medium)             │
│ • DigitalOcean: LLM cost routing (Low)           │
│                 [Open in Email] [Reply to all]   │
└──────────────────────────────────────────────────┘
```

**Loading / Thinking state:**
- Three animated dots: `● ● ●` pulsing in `--accent-blue`
- Label beneath: `"Corsair is thinking..."` in `--text-muted`

**Scroll behavior:**
- Auto-scroll to bottom on new messages
- "Scroll to bottom" floating button appears when user has scrolled up: circular, 36px, `--bg-elevated`, arrow-down icon

### 4.4 Chat Input Area

**Height:** Min 56px, expands to 200px max  
**Background:** `--bg-elevated`  
**Border:** 1px `--border-strong` on top, full border on focus  
**Border radius:** `--radius-xl`  
**Padding:** 12px 16px  

```
┌────────────────────────────────────────────────────────────┐
│ [Modes Row: 🤖 Agent] [📧 Email] [📅 Calendar] [🌐 Web]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Ask Corsair anything... Schedule meetings, reply to email, │
│ summarize threads, find free time…                         │
│                                                            │
├─────────────────────────────────────────┬──────────────────┤
│ [📎 Attach] [📋 Paste context] [/cmds]  │   [↑ Send]      │
└─────────────────────────────────────────┴──────────────────┘
```

**Mode toggle chips (above input):**
- `🤖 Agent Mode` — AI can take actions (send emails, create events)
- `📧 Email Context` — Current email thread is injected as context
- `📅 Calendar Context` — Calendar/free-time data injected
- `🌐 Web Search` — AI can search web (Corsair web search API)
- Chips: pill shape, click to toggle on/off, active = `--accent-blue` fill, inactive = `--bg-overlay` with `--text-secondary`

**Input Buttons:**
- `📎 Attach` — Opens file picker (attachments get referenced in agent actions)
- `📋 Paste Context` — Pastes current clipboard into context window
- `/cmds` — Opens slash-command autocomplete overlay
- Send button: 36×36px, `--accent-blue` background, white up-arrow icon, `--radius-md`
  - Disabled (grey) when input is empty
  - `Cmd/Ctrl+Enter` to send

**Slash commands autocomplete:**
When user types `/`, a floating list appears above input:
```
┌──────────────────────────────┐
│ /email     Draft an email    │
│ /calendar  Create an event   │
│ /schedule  Find free time    │
│ /summary   Summarize inbox   │
│ /reply     Reply to email    │
│ /search    Search emails     │
└──────────────────────────────┘
```
Navigation: Arrow keys + Enter to select

### 4.5 Context Injection Banner

When email or calendar context mode is active, a banner appears at the top of the chat canvas:

```
┌──────────────────────────────────────────────────────────┐
│ 📧  Context: "New formula editor in Tally" — Marie, Jun11│
│                                              [Clear × ]  │
└──────────────────────────────────────────────────────────┘
```
- Background: `--accent-blue-glow`
- Border: 1px `--accent-blue` at 30% opacity
- Text: `Inter Medium 12.5px`

---

## 5. EMAIL VIEW

### 5.1 Three-Column Layout

```
┌────────────┬────────────────────────┬────────────────────────────┐
│  SIDEBAR   │    EMAIL LIST          │    EMAIL READER / COMPOSER │
│  (220px)   │    (380px)             │    (remaining width)       │
│            │                        │                            │
│  Account   │  Filters row           │  Thread header             │
│  Folders   │  ─────────────────     │  From / To / Subject       │
│  Labels    │  Email rows (grouped)  │  ─────────────────────     │
│  Search    │  ─────────────────     │  Email body                │
│  Settings  │  ...                   │  ─────────────────────     │
│            │                        │  Reply/Forward bar         │
└────────────┴────────────────────────┴────────────────────────────┘
```

### 5.2 Email Sidebar (220px)

**Account Header:**
```
┌──────────────────────────────────┐
│ [●] satya.sootar06@gmail.com ▾  │   ← Google account switcher
└──────────────────────────────────┘
```
- Avatar circle (32px), name truncated, dropdown arrow
- Clicking opens account switcher pill menu

**Compose Button:**
```
[✏ Compose]
```
- Full width, 40px height, `--accent-blue` background
- Font: Inter SemiBold 14px, white text
- Icon: pencil, 16px
- Shortcut badge: `C` in muted pill on right edge

**Primary Navigation:**
```
📥 Inbox          [12]
⭐ Starred
🕐 Snoozed
📤 Sent
📋 Drafts          [3]
🗂 All Mail
⚠ Spam
🗑 Trash
```
- Active item: `--bg-highlight`, left blue border 2px
- Unread count: right-aligned pill badge `--accent-blue` bg
- Hover: `--bg-overlay`
- Font: Inter Medium 13.5px

**Labels Section:**
```
▾ Labels               [+ Add]
  ◎ Updates         [99+]
  ◎ Daily UI         [7]
  ◎ Social          [99+]
  ◎ Promotions      [99+]
  ◎ GitHub          [99+]
```
- Each label has a colored dot (customizable, same colors as the original Gmail)
- `+ Add` → inline label creation with color picker

**Views Section:**
```
▾ Views
  📊 Priority Inbox    [AI]
  🔥 Needs Reply
  📌 Pinned
  📎 Has Attachments
  👤 From: People
```

**AI Triage Panel (collapsed by default, expand on click):**
```
▾ AI Triage
  🔴 Urgent          [2]
  🟠 High            [5]
  🟡 Medium         [18]
  ⚪ Low            [74]
```

**Bottom of sidebar:**
```
[⚙ Settings]
[? Help & Shortcuts]
[📊 Storage: 8.2 GB / 15 GB]
```

---

### 5.3 Email List Panel (380px)

**Header Row:**
```
Inbox                               [☰ Layout] [⚙ Filter ▾]
─────────────────────────────────────────────────────────
```

**Filter Bar (horizontal scroll, below header):**
```
[📌 All] [🔵 Unread] [⭐ Starred] [📎 Attachments] [👤 From me] [📅 This week]
```
- Pill tabs, horizontally scrollable
- Active filter: `--accent-blue` bg
- Multiple filters stackable

**Sort Control (right side):**
```
Sort: Newest ▾ | ⬛ Density: Compact ▾
```

**Email Rows:**

*Standard row (60px height in default density):*
```
┌─────────────────────────────────────────────────────────┐
│ ● [☐] [Avatar]  Sender Name           Subject line      │
│                  Preview text…          Time  [⭐] [📎]  │
│ 🔴 URGENT                                               │
└─────────────────────────────────────────────────────────┘
```

Elements in each row (left to right):
1. **Unread dot** — 6px circle, `--dot-unread` color, hidden if read
2. **Checkbox** — appears on hover, multi-select
3. **Avatar/Logo** — 32px circle, first letter or fetched favicon
4. **Sender name** — `Inter SemiBold 13.5px` if unread, `Regular` if read
5. **Subject** — `Inter SemiBold 13.5px` if unread
6. **Preview snippet** — `--text-secondary`, truncated
7. **Timestamp** — `JetBrains Mono 12px`, `--text-muted`
8. **Star icon** — appears on hover or if starred (yellow)
9. **Attachment icon** — paper clip if has attachments
10. **Priority badge** — `🔴 URGENT` / `🟠 HIGH` pill from AI triage (shown if not Low)
11. **Thread count** — if thread has > 1 email: `[3]` badge in `--bg-overlay`

*Row states:*
- Default unread: slightly brighter background
- Hover: `--bg-overlay` + action icons appear
- Selected: `--bg-highlight` + left blue accent bar 2px
- Multi-selected: checked checkbox + `--bg-highlight`

*Row hover action bar (replaces preview text on hover):*
```
[Archive ↗] [Delete 🗑] [Snooze 🕐] [Mark Read ✓] [Label 🏷]
```
- Icons with text labels on hover, icon-only on tight widths
- All keyboard accessible

**Groupings:**
```
─── Today ──────────────────────────────────────────────
[email rows]
─── Yesterday ──────────────────────────────────────────
[email rows]
─── Last 7 Days ─────────────────────────────────────────
[email rows]
```

**Empty State:**
```
        ✉️
   Your inbox is empty!
   Corsair AI has nothing to triage.
   
   [Refresh]  [Check All Mail]
```

**Loading Skeleton:**
- 3-4 ghost rows with animated shimmer (`--bg-overlay` → `--bg-highlight` loop)

---

### 5.4 Email Thread Reader / Composer (Main Pane)

**Thread Header:**
```
┌────────────────────────────────────────────────────────────┐
│  ← Back                      [Archive] [Delete] [⋮ More]   │
│                                                            │
│  New formula editor in Tally                               │
│  2 messages · Updates label                                │
└────────────────────────────────────────────────────────────┘
```

- Back arrow: returns to email list (mobile-only on desktop it's always visible)
- Actions row: `Archive` (icon + text), `Delete` (icon + text), `⋮ More` dropdown
- Subject: `Geist SemiBold 22px`, `--text-primary`
- Metadata: `Inter Regular 13px`, `--text-secondary`

**AI Summary Banner (appears for threads > 2 emails):**
```
┌──────────────────────────────────────────────────────────────┐
│ 🤖  AI Summary: Tally released a new formula editor that    │
│ enables complex expressions in conditional logic fields.    │
│ Submission PDFs now auto-attach to email notifications.     │
│                                    [Dismiss] [Ask AI more ▸]│
└──────────────────────────────────────────────────────────────┘
```
- Background: `--color-info` at 8% opacity (`#6366F114`)
- Left border: 3px `--color-info`

**Email Message Bubble:**
```
┌──────────────────────────────────────────────────────────────┐
│ [Avatar] Marie at Tally <marie@tally.so>     Jun 11, 9:00 PM│
│          To: SATYA SOOTAR                     [↩] [↪] [⋮]  │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│  ✿  (Tally logo)                                            │
│                                                              │
│  Hi SATYA,                                                   │
│                                                              │
│  The updates we're proudest of are often the ones that      │
│  quietly remove friction...                                  │
│                                                              │
│  **Formula editor**                                         │
│  Until now, conditional logic calculations were limited...  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

*Email message controls (top-right of each email):*
- `↩ Reply` — opens inline reply
- `↪ Forward` — opens inline forward
- `⋮ More` → dropdown:
  - Reply All
  - Forward
  - Print
  - Report Spam
  - Block Sender
  - Create Filter from sender
  - Copy email link
  - Show original (raw headers)

*Email body rendering:*
- HTML emails rendered in sandboxed iframe
- `max-width: 600px`, centered
- External images: blocked by default, `[Show images from this sender]` prompt
- Links: open in new tab with safety warning overlay for suspicious URLs

*Attachment area (if email has files):*
```
┌──── Attachments (2) ──────────────────────────────────────┐
│ 📄 Q3-Report.pdf  (2.4 MB)  [Preview] [Download]         │
│ 🖼 screenshot.png (180 KB)  [Preview] [Download]         │
│                              [Download All as .zip]       │
└───────────────────────────────────────────────────────────┘
```

**Reply/Compose Inline Editor:**

Triggered by `Reply` button or keyboard shortcut `R`:

```
┌──────────────────────────────────────────────────────────────┐
│ To: Marie at Tally <marie@tally.so>                     [×] │
│ Cc: [+ Add Cc]    Bcc: [+ Add Bcc]                          │
│ Subject: Re: New formula editor in Tally                     │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│  [Rich text editor area]                                     │
│                                                              │
│  Hi Marie,                                                   │
│  |  ← cursor blinking                                       │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  > On Jun 11, 9:00 PM, Marie at Tally wrote:                │
│  > Hi SATYA, The updates we're proudest of...               │
│                                                              │
│ ──────────────────────────────────────────────────────────  │
│ [B] [I] [U] [~~] [Link] [List] [Quote] [Code] [H1 H2 H3]   │
│ ──────────────────────────────────────────────────────────  │
│ [📎 Attach] [🤖 AI Draft] [📅 Schedule Send] [Send ⌘↵]    │
└──────────────────────────────────────────────────────────────┘
```

**Formatting toolbar:**
- `B` Bold, `I` Italic, `U` Underline, `~~` Strikethrough
- `Link` — URL insertion modal
- Bullet list, numbered list
- `Quote` — blockquote
- `Code` — inline code / code block
- `H1 H2 H3` — heading sizes
- All buttons: 28px square, icon-only, tooltip on hover

**Bottom action bar:**
- `📎 Attach` — file picker (supports drag & drop onto editor area)
  - File size limit shown: `Max 25MB per attachment`
  - Uploaded files appear as chips above the editor
- `🤖 AI Draft` — AI writes a draft reply based on email context
  - Shows: `"AI is drafting your reply..."` loading state
  - Draft appears in editor, user can edit before sending
- `📅 Schedule Send` — calendar picker popup to choose send time
  - Quick options: `Tomorrow 9 AM`, `Monday 9 AM`, `Custom`
- `Send ⌘↵` — sends email immediately
  - Animated: button transforms to `"Sent ✓"` for 1.5s then disappears

**Compose Window (standalone, from Compose button):**
Full-width modal overlay OR opens as a floating panel bottom-right (user preference):

```
┌──── New Message ──────────────────────────── [−] [⤢] [×] ─┐
│ To:       [typing → contacts autocomplete dropdown]        │
│ Cc:       [+ Add Cc]                                       │
│ Bcc:      [+ Add Bcc]                                      │
│ Subject:  [                                              ]  │
│ ────────────────────────────────────────────────────────── │
│                                                            │
│ [Rich text editor — full featured]                         │
│                                                            │
│                                                            │
│ ────────────────────────────────────────────────────────── │
│ [Formatting toolbar]                                       │
│ ────────────────────────────────────────────────────────── │
│ [📎][🤖 AI Draft][🎨 Templates][📅 Schedule][Send ⌘↵]    │
└────────────────────────────────────────────────────────────┘
```
- `[−]` Minimize to bottom bar
- `[⤢]` Maximize to full screen
- `[×]` Close (auto-saves as draft with confirmation)

**Contact autocomplete:**
```
┌──────────────────────────────────┐
│ 👤 Marie at Tally                │
│    marie@tally.so                │
├──────────────────────────────────┤
│ 👥 TCS Jobs                      │
│    tcs.ion@tcs.com               │
└──────────────────────────────────┘
```
- Shows avatar, name, email
- Fuzzy search across contacts + recent sends
- Can add multiple recipients as chips

**AI Draft Feature:**
```
┌──── AI Draft ─────────────────────────────── [×] ─────────┐
│ 🤖 Suggest a tone:                                         │
│ [Professional] [Friendly] [Brief] [Detailed]               │
│ ────────────────────────────────────────────────────────── │
│ Generating draft...                                        │
│ ────────────────────────────────────────────────────────── │
│ Hi Marie,                                                  │
│ Thank you for the exciting updates to Tally! The new       │
│ formula editor looks incredibly powerful...                │
│ ────────────────────────────────────────────────────────── │
│ [Use this draft] [Regenerate] [Discard]                    │
└────────────────────────────────────────────────────────────┘
```

**Email Templates:**
```
┌──── Templates ─────────────────────────────────────────────┐
│ [Search templates...]                                      │
│ ────────────────────────────────────────────────────────── │
│ 📋 Quick Acknowledgment                                    │
│ 📋 Meeting Follow-up                                       │
│ 📋 Interview Thank You                                     │
│ 📋 Out of Office                                           │
│                               [+ New Template]            │
└────────────────────────────────────────────────────────────┘
```

---

### 5.5 Email Search — Advanced

**Search bar in sidebar (or `⌘F` anywhere in email view):**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍  Search emails...                             [⌘F / ESC] │
└─────────────────────────────────────────────────────────────┘
```

**Expanded search panel (on focus):**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍  [                                             ] [Search] │
│                                                             │
│ ── Quick Filters ─────────────────────────────────────────  │
│ From: [         ] To: [          ] Subject: [             ] │
│                                                             │
│ Date range: [From: ──────] [To: ──────]                     │
│ Has: [📎 Attachment] [⭐ Starred] [📖 Unread] [🏷 Label ▾]  │
│ Size: [Larger than: ─── MB]                                 │
│                                                             │
│ ── Natural Language ────────────────────────────────────── │
│ 🤖 "Try: emails from TCS last week with attachments"        │
└─────────────────────────────────────────────────────────────┘
```

**Search results:**
- Same email list format with highlighted matches (yellow background on matching text)
- AI-powered semantic search if Corsair search API is enabled
- `Found 23 results for "Tally"` — count shown in header
- Vector search badge: `⚡ Lightning Search (local)` when using Postgres vector index

---

### 5.6 Email Multi-Select Mode

When 1+ checkboxes are checked:

```
┌──────────────────────────────────────────────────────────────┐
│ [☑] 5 selected               [Archive] [Delete] [Label] [⋮] │
└──────────────────────────────────────────────────────────────┘
```
- Blue action bar replaces normal header
- `Archive` — archives all selected
- `Delete` — moves to trash with undo toast
- `Label` — opens label picker
- `⋮ More` → Mark read, Mark unread, Snooze, Move to, Star/Unstar

**Undo Toast:**
```
┌────────────────────────────────┐
│ 🗑 5 emails moved to Trash.    │
│                      [Undo ⌘Z]│
└────────────────────────────────┘
```
- Bottom-center screen
- 5s auto-dismiss
- `--bg-elevated`, border `--border-strong`

---

## 6. CALENDAR VIEW

### 6.1 Layout

```
┌──────────┬─────────────────────────────────────────────────┐
│ CAL      │                                                  │
│ SIDEBAR  │  CALENDAR GRID                                   │
│ (260px)  │  (Month / Week / Day view)                       │
│          │                                                  │
│ Mini Cal │                                                  │
│          │                                                  │
│ My Cals  │                                                  │
│          │                                                  │
│ Upcoming │                                                  │
└──────────┴─────────────────────────────────────────────────┘
```

### 6.2 Calendar Sidebar (260px)

**Mini Month Calendar:**
```
       June 2026        ← →
Su  Mo  Tu  We  Th  Fr  Sa
                  1   2   3
 4   5   6   7   8   9  10
11  12  13  14  15  16  17
18  19  20  21  22  23  24
25  26  27  28  29  30
```
- Today highlighted: filled circle `--accent-blue`
- Selected day: outlined circle `--border-strong`
- Days with events: small dot beneath date
- Click any date → jumps to day view
- `←` `→` arrows: navigate months

**View Switcher:**
```
[Day] [Week] [Month] [Agenda]
```
- Pill tab group below mini calendar
- Keyboard: `D` Day, `W` Week, `M` Month, `A` Agenda

**My Calendars:**
```
▾ My Calendars              [+ Create]
  ●  satya.sootar06         (red)
  ●  Birthdays              (green)
  ●  Family                 (teal)
  ●  Tasks                  (blue)
```
- Each calendar: colored dot, name, toggle visibility (click dot to show/hide)
- `+ Create` → new calendar creation inline form
- Long press / right-click → options: Edit color, Rename, Delete, Hide

**Other Calendars:**
```
▾ Other Calendars
  ●  Holidays in India      (green)
  [+ Add calendar]
```

**Upcoming Events (next 5):**
```
▾ Upcoming
  📅 Today, 3:00 PM
     Team standup
  📅 Tomorrow, 9:00 AM  
     Meeting — friend@corsair.dev
  📅 Jun 26, All day
     Muharram/Ashura
```
- Clicking jumps to that date/event
- Event color matches calendar color

**Quick Create:**
```
[+ New Event]  ← Full button below all sections
```

---

### 6.3 Month View

**Grid layout:**

```
       Sun   Mon   Tue   Wed   Thu   Fri   Sat
────────────────────────────────────────────────
Week1 │  31  │  1   │  2   │  3   │  4   │  5   │  6   │
      │      │      │      │      │      │      │      │
      │      │      │      │      │  2 events │      │
────────────────────────────────────────────────
Week2 │  7   │  8   │  9   │  10  │  11  │ 12●  │  13  │
...
```

- Today's date: filled `--accent-blue` circle
- Day numbers: `JetBrains Mono 13px`
- Each cell: min 100px height, overflow with `+N more` link
- Events within cells: colored pill, 20px height, event title truncated
- Click cell (empty area) → Create event quick-add popover
- Click event pill → Event detail popover
- Drag event pill to different cell → Reschedule (with confirmation)
- `+2 more` overflow link → Expands cell inline OR opens day view

**Event Pill Design:**
```
[●  Team Standup 3 PM]
```
- Colored left accent dot (calendar color)
- Title text: `Inter Medium 12px`
- Time prefix for timed events
- All-day events: full-width pill with colored background at 20% opacity + solid left border

---

### 6.4 Week View

**Header:**
```
Week of Jun 7–13, 2026       [← Prev] [Today] [Next →]
─────────────────────────────────────────────────────
      Sun 7   Mon 8   Tue 9  Wed 10  Thu 11  Fri 12  Sat 13
All-day row ──────────────────────────────────────────────
12 AM │       │        │       │       │       │  ████  │
 1 AM │       │        │       │       │       │  ████  │  
...
```

- Time column: `JetBrains Mono 12px`, `--text-muted`
- Current time indicator: red horizontal line across all columns with time label
- Today column: subtle `--accent-blue` at 3% opacity background
- Event blocks: colored rectangle, shows title + time range
- Click event block → Event detail panel (right sidebar)
- Click time slot → Quick create event at that time
- All-day row: fixed at top for all-day events

**Event Block Design (in week/day view):**
```
┌────────────────────────┐
│ Team Standup           │  ← title, truncated
│ 3:00 – 3:30 PM        │  ← time range
│ Zoom Link ·  [Join ▸]  │  ← optional quick join
└────────────────────────┘
```
- Color: calendar color at 20% opacity background, 100% left border
- Border radius: `--radius-sm`
- Minimum height: 30px (30 min slot)
- Overflow: title truncated, show full on hover

---

### 6.5 Day View

Same as week view but single column, wider slots showing full event details.

---

### 6.6 Agenda View

```
─── Thursday, Jun 12 ─────────────────────────────────────
  9:00 AM  │  ● Team Standup · 30 min · Zoom · [Join]
  3:00 PM  │  ● 1:1 with Manager · 1 hour

─── Friday, Jun 13 ────────────────────────────────────────
  No events — [+ Add event]

─── Saturday, Jun 14 ──────────────────────────────────────
  ...
```
- Chronological list, grouped by day
- No-event days shown with empty state message
- Scrollable infinitely

---

### 6.7 Event Creation Modal

**Quick Add (popover on cell click):**
```
┌──────────────────────────────────────────┐
│  Create Event                        [×] │
│  ──────────────────────────────────────  │
│  [Event title...                      ]  │
│                                          │
│  📅 Thu, Jun 12, 2026                   │
│  🕐 3:00 PM → 4:00 PM                   │
│                                          │
│  [More options]            [Create ↵]   │
└──────────────────────────────────────────┘
```

**Full Event Creation Modal (from "More options"):**

```
┌──────────────── New Event ─────────────────────── [×] ─┐
│  [Event title...                                     ]  │
│                                                         │
│  📅  Thu, Jun 12, 2026  🕐 3:00 PM  →  4:00 PM        │
│      [+ Add time zone]              [☐ All day]        │
│                                                         │
│  🔁  Does not repeat  [▸ Edit recurrence]               │
│                                                         │
│  👥  Guests                [Add guests by email...]     │
│      ┌──────────────────────────────────────────────┐   │
│      │ friend@corsair.dev  (Pending)            [×] │   │
│      └──────────────────────────────────────────────┘   │
│      [Suggest times based on their availability ✨]      │
│                                                         │
│  📍  Location  [Add location or video call link...]     │
│      [Google Meet ▸] [Zoom ▸] [Custom ▸]               │
│                                                         │
│  📋  Description  [Add notes, agenda...]                │
│                                                         │
│  🔔  Notification:  [10 minutes ▾]  [+ Add another]    │
│                                                         │
│  📁  Calendar: satya.sootar06 ▾                         │
│                                                         │
│  🔒  Status: [Busy ▾]   Visibility: [Default ▾]        │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  [Send email to guests ☐]                               │
│  [Cancel]                        [Save event ⌘↵]       │
└─────────────────────────────────────────────────────────┘
```

**Recurrence Editor:**
```
┌──── Recurrence ────────────────────────┐
│ Repeat:  [Daily ▾] [Weekly ▾] [Monthly ▾] [Custom]
│ Every:   [1] [week ▾]                  │
│ On:      [S] [M] [T] [W] [T] [F] [S]  │
│ End:     [Never ▾] [After N times ▾]   │
│                     [On date ▾]        │
│           [Cancel]  [Done]             │
└────────────────────────────────────────┘
```

**AI Scheduling Assist (when guests added):**
```
┌──────────────────────────────────────────────────────────┐
│ 🤖  AI found 3 free time slots that work for everyone:   │
│                                                          │
│ ●  Thu Jun 19, 9:00–10:00 AM  ·  [Select]               │
│ ●  Thu Jun 19, 2:00–3:00 PM   ·  [Select]               │
│ ●  Fri Jun 20, 11:00 AM–12PM  ·  [Select]               │
└──────────────────────────────────────────────────────────┘
```

**Event Detail Popover (on click):**
```
┌──────────────────────────────────── [✏ Edit] [🗑] [×] ─┐
│  Team Standup                                           │
│  ─────────────────────────────────────────────────     │
│  📅  Thu, Jun 12 · 3:00 – 3:30 PM                      │
│  🔁  Daily                                              │
│  👥  You, Manager, 2 others                             │
│  📍  Zoom · https://zoom.us/j/...          [Join ▸]    │
│  🔔  10 minutes before                                  │
│  ─────────────────────────────────────────────────     │
│  RSVP:  [✓ Accept]  [? Maybe]  [✗ Decline]             │
│  ─────────────────────────────────────────────────     │
│  📧  [Send email to attendees]                          │
└─────────────────────────────────────────────────────────┘
```

---

## 7. SPLIT VIEW SYSTEM

### 7.1 Email + Calendar (Most Common)

```
┌────────────────────────────────────────────────────────┐
│  TOP BAR: [Chat] [Email ●] [Calendar ●]               │
├─────────────────────────────┬──────────────────────────┤
│  EMAIL VIEW                 │  CALENDAR VIEW           │
│  (Full email experience     │  (Full calendar          │
│   compressed to 50% width)  │   experience 50%)        │
│                             │                          │
│  Sidebar hidden in split    │  Sidebar hidden in split │
│  (icon-only mode, 48px)     │  (icon-only mode, 48px)  │
│                             │                          │
│  Email list + reader stacked│  Week view default       │
│  vertically in this half    │  in this mode            │
│                             │                          │
├─────────────────────────────┴──────────────────────────┤
│  ← Drag handle (hover to show, --accent-blue glow)     │
└────────────────────────────────────────────────────────┘
```

**Sidebar collapse in split mode:**
- Both email and calendar sidebars collapse to icon strip (48px) to maximize content
- Icons show tooltips on hover for navigation
- Click icon to expand sidebar temporarily as overlay

**Cross-pane interaction:**
- Clicking "Schedule Meeting" in an email → Calendar pane highlights suggested times
- Creating event in calendar → Option to `Send email to all guests` appears in email pane
- AI Chat floating button `💬` in bottom-right of split views → Opens mini chat overlay

### 7.2 Chat + Email

- Chat pane on left (40% width)
- Email pane on right (60% width)
- AI can reference and act on visible emails
- Context auto-injected: current open email is in AI context
- `"Reply to this email saying I'll attend"` → AI drafts reply inline in email pane

### 7.3 Chat + Calendar

- Chat pane on left (40%)
- Calendar week/day view on right (60%)
- `"Block 2 hours tomorrow for deep work"` → AI creates event visible in right pane
- `"When am I free next week?"` → AI analyzes calendar and responds with time slots

---

## 8. COMMAND PALETTE (⌘K)

**Trigger:** `⌘K` (Mac) or `Ctrl+K` (Windows/Linux), or click search icon in top bar

**Design:**
```
┌──────────────────────────────────────────────────────────────┐
│  🔍  Type a command or search...                  ESC to close│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ── Recently Used ──────────────────────────────────────     │
│  📧  Compose new email                              C        │
│  📅  Create event                                   N        │
│  🤖  Ask AI                                         /        │
│                                                              │
│  ── Email Actions ──────────────────────────────────────     │
│  📥  Go to Inbox                                    G I      │
│  ✉️   Go to Sent                                    G S      │
│  ✏️   Compose email                                 C        │
│  🔍  Search emails                                  ⌘F       │
│  📎  Show emails with attachments                            │
│  ⭐  Show starred emails                                      │
│                                                              │
│  ── Calendar Actions ────────────────────────────────────    │
│  📅  Go to today                                    T        │
│  ➕  Create new event                               N        │
│  📅  Go to date…                                    G D      │
│  🗓  Switch to month view                           M        │
│  🗓  Switch to week view                            W        │
│                                                              │
│  ── AI Actions ──────────────────────────────────────────    │
│  🤖  Ask AI to draft reply                                   │
│  🤖  Summarize inbox                                         │
│  🤖  Find free time next week                                │
│  🤖  Schedule meeting with…                                  │
│                                                              │
│  ── App ─────────────────────────────────────────────────    │
│  ⚙️   Open Settings                                 ⌘,       │
│  🌙  Toggle dark/light mode                                  │
│  ?   Show keyboard shortcuts                        ?        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Real-time filtering as user types
- Arrow keys navigate up/down
- Enter selects action
- Escape closes palette
- Results fuzzy-matched (e.g., "cal" matches "Calendar")
- Search prefix: typing `@name` searches contacts, `#label` filters by label
- Recent commands shown on empty state

**Visual specs:**
- Modal overlay: `--bg-app` at 70% opacity backdrop
- Palette card: 640px wide, centered, `--bg-elevated`, `--shadow-xl`
- Input: 52px height, `Inter Regular 16px`
- Row height: 40px
- Section headers: `Inter Medium 11px`, `--text-muted`, uppercase
- Keyboard shortcut badges: `JetBrains Mono 11px`, `--bg-overlay` pill

---

## 9. KEYBOARD SHORTCUT SYSTEM

### Global Shortcuts
| Shortcut | Action |
|---|---|
| `⌘K` | Open Command Palette |
| `G + C` | Go to Chat |
| `G + E` | Go to Email |
| `G + K` | Go to Calendar |
| `?` | Show Keyboard Shortcuts overlay |
| `⌘,` | Open Settings |
| `⌘/` | Toggle sidebar |
| `Esc` | Close modal / deselect |

### Email Shortcuts
| Shortcut | Action |
|---|---|
| `C` | Compose new email |
| `R` | Reply to selected email |
| `A` | Reply All |
| `F` | Forward |
| `E` or `Y` | Archive email |
| `#` | Delete email |
| `!` | Report spam |
| `S` | Star / unstar |
| `I` | Mark as important |
| `U` | Mark as unread |
| `J` | Move to next email |
| `K` | Move to previous email |
| `Enter` | Open selected email |
| `Esc` | Back to list |
| `⌘F` | Search emails |
| `G + I` | Go to Inbox |
| `G + S` | Go to Sent |
| `G + D` | Go to Drafts |
| `G + T` | Go to Trash |
| `Z` | Undo last action |
| `X` | Select email |
| `*A` | Select all |
| `B` | Snooze email |
| `⌘Enter` | Send email |
| `⌘Shift+D` | Discard draft |

### Calendar Shortcuts
| Shortcut | Action |
|---|---|
| `N` | New event |
| `T` | Go to today |
| `D` | Day view |
| `W` | Week view |
| `M` | Month view |
| `A` | Agenda view |
| `←` | Previous period |
| `→` | Next period |
| `Enter` | Open selected event |

**Shortcuts Help Overlay:**
Triggered by `?` key — a beautiful overlay card showing all shortcuts grouped by section, dark card with clean table layout.

---

## 10. NOTIFICATIONS & REAL-TIME PANEL

### 10.1 Notification Bell Dropdown

**Trigger:** Click bell icon in top bar

```
┌──── Notifications ───────────────── [Mark all read] [×] ─┐
│                                                           │
│  ── New ─────────────────────────────────────────────── │
│  📧  New email from DigitalOcean        2 min ago        │
│       "Cut your LLM bill without..."  [Open] [Archive]   │
│                                                           │
│  📅  Calendar invite: Team Standup     15 min ago        │
│       Thu Jun 12, 3:00 PM             [Accept] [Decline] │
│                                                           │
│  🤖  AI priority alert: 2 urgent emails need reply       │
│                                        [View]            │
│                                                           │
│  ── Earlier ─────────────────────────────────────────── │
│  📧  3 new emails from TCS              1 hr ago         │
│  📅  Event reminder: Daily standup      2 hr ago         │
│                                                           │
│  [View all notifications]                                 │
└───────────────────────────────────────────────────────────┘
```

**Real-time updates via Corsair Webhooks:**
- New email arrives → notification dot on bell, toast in bottom-right corner
- Calendar invite received → desktop notification + in-app toast
- Event starting soon → 10-minute reminder toast

**Toast notification design:**
```
┌──────────────────────────────────────────┐
│ 📧 New email                             │
│ Marie at Tally · New formula editor      │
│                      [Open] [Archive]    │
└──────────────────────────────────────────┘
```
- Bottom-right corner
- 5s auto-dismiss (hover pauses timer)
- Slide in from right: `translateX(120%) → 0`, 250ms spring

---

## 11. SETTINGS & PREFERENCES

**Trigger:** `⌘,` or click gear icon → opens full-page settings or right-panel settings

### Settings Sidebar
```
Account
  ● Connected Accounts
  ● Profile & Avatar

Email
  ● General
  ● Appearance
  ● Filters & Labels
  ● Blocked Senders
  ● Signatures
  ● Vacation Responder

Calendar
  ● General
  ● Notifications
  ● Working Hours
  ● View Defaults

AI Features
  ● Priority Filtering
  ● Auto-Draft Replies
  ● Smart Scheduling
  ● AI Persona / Tone

Keyboard
  ● Shortcuts List
  ● Custom Shortcuts

Notifications
  ● Email Notifications
  ● Calendar Reminders
  ● Desktop Notifications

Appearance
  ● Theme (Dark / Light / System)
  ● Accent Color
  ● Font Size
  ● Email Density (Compact / Default / Relaxed)
  ● Split View Defaults

Privacy & Security
  ● Data & Permissions
  ● Linked Apps
  ● Sign Out
```

### Key Settings Pages

**AI Features Settings:**
```
Priority Email Filtering
─────────────────────────────────────────────────────
Enable AI email triage          [● Toggle ON]
Triage confidence threshold     [─────●─── 75%]
Show priority badges in list    [● Toggle ON]
Auto-archive low priority       [○ Toggle OFF]

Smart Compose
─────────────────────────────────────────────────────
Enable AI reply drafts          [● Toggle ON]
Preferred tone                  [Professional ▾]
Include signature in drafts     [● Toggle ON]

Smart Scheduling
─────────────────────────────────────────────────────
Working hours                   [9:00 AM → 6:00 PM]
Preferred meeting length        [30 min ▾]
Buffer between meetings         [15 min ▾]
```

**Appearance Settings:**
```
Theme
  ○ Light
  ● Dark  ← selected
  ○ System default

Accent Color
  ● Blue    ○ Purple   ○ Green   ○ Orange

Font Size
  ○ Small   ● Default  ○ Large

Email List Density
  ○ Compact (48px rows)
  ● Default (60px rows)
  ○ Relaxed (80px rows)
```

---

## 12. AUTHENTICATION & ONBOARDING

### 12.1 Landing / Login Page

**Layout:** Centered, full-page, dark background
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│         ⚡ Corsair                                       │
│                                                          │
│    Your email and calendar,                              │
│    reimagined with AI.                                   │
│                                                          │
│    ┌────────────────────────────────────────────┐        │
│    │  [G]  Continue with Google                │        │
│    └────────────────────────────────────────────┘        │
│                                                          │
│    Connecting Gmail and Google Calendar.                 │
│    Your data stays yours.                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```
- Background: `--bg-app` with subtle animated grid or gradient background
- Logo: 48px, animated on load (scale + fade)
- Headline: `Geist Bold 36px`, white
- Subline: `Inter Regular 18px`, `--text-secondary`
- Google button: 52px height, `--bg-elevated` background, Google colored logo, `Inter SemiBold 16px`

### 12.2 Onboarding Flow (Post-Auth, 3 steps)

**Step 1 — Welcome & Setup:**
```
     ⚡ Welcome to Corsair, Satya!

  Let's set up your workspace.
  
  ✓ Gmail connected (satya.sootar06@gmail.com)
  ✓ Google Calendar connected
  ● Syncing emails... 347 imported
  
              [Next →]
```

**Step 2 — AI Preferences:**
```
     🤖 Teach Corsair your preferences

  Email priority style:
  ○ Aggressive (only show truly important)
  ● Balanced (recommended)
  ○ Light (just organize, no filtering)
  
  Your working hours:
  📅 Monday – Friday
  🕐 9:00 AM – 6:00 PM  [Edit]
  
              [← Back]  [Next →]
```

**Step 3 — Keyboard Shortcut Intro:**
```
     ⌨️ Power user tip

  Press these to fly through email:
  
  C    Compose email
  E    Archive
  R    Reply
  ⌘K   Command everything
  
  [Show me all shortcuts]
  
              [← Back]  [Start using Corsair →]
```

---

## 13. AI FEATURE INVENTORY

### 13.1 Email AI Features

| Feature | Trigger | Description |
|---|---|---|
| Priority Triage | Automatic | Every incoming email is scored 0-100 for priority using cheap LLM (Claude Haiku / GPT-4o mini). Score determines badge: Urgent / High / Medium / Low |
| AI Draft Reply | Button in reply bar OR `/reply` in chat | Generates a contextual draft reply based on email thread. User can edit before sending. |
| Thread Summary | Auto for threads > 3 emails | Shows collapsible AI summary banner at top of long threads |
| Smart Compose | Inline as user types | Autocomplete suggestions in email body (ghost text, Tab to accept) |
| Unsubscribe Assist | Button on newsletters | AI identifies newsletter/promo emails and offers 1-click unsubscribe |
| Email Templates | Templates menu | AI can generate templates from scratch or from example emails |
| Tone Detector | Passive | Shows small indicator: "Formal / Casual / Urgent" on incoming emails |
| Schedule Send | Schedule Send button | AI suggests best time to send based on recipient's timezone and typical response patterns |
| Meeting Extraction | On emails mentioning meetings | AI detects meeting mentions and shows "Add to Calendar?" CTA inline |

### 13.2 Calendar AI Features

| Feature | Trigger | Description |
|---|---|---|
| Smart Scheduling | When adding guests | AI checks all guests' calendars via Corsair and finds mutually free slots |
| Focus Time | `/block time` in chat | AI blocks deep work periods in calendar automatically |
| Meeting Prep | 30 min before event | AI briefs you on event context: agenda, last email from attendees, their LinkedIn |
| Conflict Detection | Always-on | AI warns when new event conflicts with existing ones and suggests resolutions |
| Travel Time Padding | Setting | AI adds travel/buffer time between events based on location |
| Calendar Summary | Morning digest | Daily AI summary: "You have 3 meetings today. Your busiest hour is 2-3 PM." |

### 13.3 Cross-Feature AI (Agent Chat)

Example prompts and expected behaviors:

```
User: "Send a calendar invite to friend@corsair.dev at 9 AM next Thursday. 
       Send him an email too saying I look forward to our meeting."

AI:   ✓ Created calendar invite: Meeting — Thu Jun 19, 9:00 AM
      ✓ Drafted email: "Looking forward to our meeting"
      
      [Confirm & Send both] [Edit] [Cancel]
```

```
User: "What needs my attention in email today?"

AI:   You have 2 urgent emails:
      🔴 TCS: AI certification deadline response (Today)
      🔴 DigitalOcean: Invoice requires approval
      
      5 high priority emails in your inbox.
      [Open email view] [Reply to TCS] [Reply to DigitalOcean]
```

```
User: "Block 3 hours of deep work this week"

AI:   Found 3 free 3-hour windows this week:
      ● Wednesday Jun 14, 9 AM – 12 PM
      ● Thursday Jun 15, 1 PM – 4 PM  ← recommended (no meetings adjacent)
      ● Friday Jun 16, 10 AM – 1 PM
      
      [Block Wednesday] [Block Thursday] [Block Friday]
```

---

## 14. COMPONENT LIBRARY REFERENCE

### Buttons

```
Primary:   [  Action  ]  — --accent-blue bg, white text, --radius-md, h-9
Secondary: [  Action  ]  — --bg-overlay bg, --text-primary, --border-default border
Ghost:     [  Action  ]  — transparent, --text-secondary, hover: --bg-overlay
Danger:    [  Action  ]  — --color-error bg or border, destructive actions
Icon:      [ ⚡ ]        — square, --radius-md, icon only, tooltip on hover
```

### Input Fields
```
┌─────────────────────────────────────┐
│ 🔍  Placeholder text...             │
└─────────────────────────────────────┘
```
- Height: 40px (default), 52px (large)
- Border: 1px `--border-default`, focus: `--accent-blue` with `--shadow-glow-blue`
- Border radius: `--radius-md`
- Font: Inter Regular 14px

### Dropdown / Select
```
[Option selected ▾]
```
- Click → opens below (or above if near bottom of screen)
- Backdrop blur: none, positioned relative
- Max height: 240px with scroll

### Tags / Chips
```
[🏷 Label]    [● Priority]    [× Dismissible]
```
- Height: 24px
- Padding: 4px 8px
- Border radius: `--radius-full`
- Colors: semantic or label colors

### Toasts
- Bottom-right, stack up to 3
- Slide in from right
- 5s dismiss (hover to pause)
- Types: Success (green), Error (red), Info (blue), Warning (yellow)

### Modals
- Centered overlay
- Backdrop: `rgba(0,0,0,0.6)`, backdrop-blur 4px
- Card: `--bg-elevated`, `--shadow-xl`, `--radius-xl`
- Always has close `[×]` button top-right
- ESC to close

### Skeleton Loaders
```
▓▓▓▓▓▓▓▓▓▓▓▓   ← animated shimmer
▓▓▓▓▓▓▓▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```
- Color: `--bg-overlay` with animated gradient sweep
- Used in: email list loading, calendar loading, chat history loading

### Avatar
```
[SA]   ← initials fallback
[ 🖼]  ← image if available
```
- Sizes: 24px, 32px, 40px, 48px
- Border radius: `--radius-full` (circle)
- Fallback: first 2 initials, colored background (deterministic from email hash)

---

## 15. PAGE-BY-PAGE IMPLEMENTATION CHECKLIST

### Pages to Build

1. **`/` (Root / Landing)**
   - [ ] Google OAuth button
   - [ ] Animated background
   - [ ] App description hero text
   - [ ] Redirect to `/app` if already authenticated

2. **`/onboarding`**
   - [ ] 3-step wizard
   - [ ] Gmail sync progress
   - [ ] AI preference setup
   - [ ] Keyboard shortcut intro

3. **`/app` (Main App Shell)**
   - [ ] Top tab bar with all tabs
   - [ ] Split view logic
   - [ ] Theme toggle (dark/light)
   - [ ] Command palette (`⌘K`)
   - [ ] Keyboard shortcut listener

4. **`/app/chat` (Chat View)**
   - [ ] Chat history sidebar
   - [ ] Message canvas
   - [ ] Streaming AI responses
   - [ ] Action cards (email, event)
   - [ ] Mode toggles
   - [ ] Slash commands

5. **`/app/email` (Email View)**
   - [ ] Email sidebar (folders, labels, views)
   - [ ] Email list with priority badges
   - [ ] Email thread reader
   - [ ] Inline reply/compose
   - [ ] Full compose modal
   - [ ] Rich text editor
   - [ ] Attachment upload
   - [ ] AI draft button
   - [ ] Schedule send
   - [ ] Search & advanced filters
   - [ ] Multi-select + bulk actions
   - [ ] Undo toast

6. **`/app/calendar` (Calendar View)**
   - [ ] Mini calendar sidebar
   - [ ] Month / Week / Day / Agenda views
   - [ ] Quick add event popover
   - [ ] Full event creation modal
   - [ ] RSVP actions on invites
   - [ ] Event detail popover
   - [ ] AI scheduling assist
   - [ ] Recurrence editor
   - [ ] Real-time event updates

7. **`/app/settings`**
   - [ ] All settings sections listed above
   - [ ] AI feature toggles
   - [ ] Theme customization
   - [ ] Connected accounts

8. **`/api/webhooks/email`**
   - [ ] Corsair webhook receiver
   - [ ] Real-time toast notification trigger

9. **`/api/webhooks/calendar`**
   - [ ] Calendar update receiver
   - [ ] Reminder notification trigger

---

## APPENDIX: DESIGN INSPIRATIONS & REFERENCES

| Inspiration | What to borrow |
|---|---|
| **Superhuman** | Email keyboard shortcuts, clean inbox density, send + archive flow |
| **Linear** | Command palette design, sidebar organization, keyboard-first ethos |
| **Raycast** | Command palette interactions, quick actions |
| **Notion Calendar** | Event creation UX, clean week view |
| **ChatGPT** | Chat canvas, action cards, streaming message design |
| **Vercel Dashboard** | Dark mode palette, typography, component quality |
| **Mimestream** | Multi-account Gmail UI, label display |

---

## APPENDIX: TECH IMPLEMENTATION NOTES

### Color Mode Implementation (Next.js + Tailwind)
```javascript
// tailwind.config.js
darkMode: 'class' // Toggle via class on <html>

// Theme toggle
document.documentElement.classList.toggle('dark')
localStorage.setItem('theme', isDark ? 'dark' : 'light')
```

### Font Loading (Next.js)
```javascript
// app/layout.tsx
import { Inter, Geist } from 'next/font/google'
import localFont from 'next/font/local'
// JetBrains Mono via next/font/google
```

### Animation Library
```
Framer Motion — for page transitions, modal animations, list stagger
```

### State Management
```
Zustand — global state (current view, selected email, active calendars)
React Query (TanStack Query) — server state, caching, real-time updates
```

### Real-Time
```
Corsair webhooks → Next.js API route → Server-Sent Events (SSE) or 
  WebSocket to client → Zustand store update → UI re-render
```

### Vector Search (Postgres)
```sql
-- pgvector extension
CREATE EXTENSION vector;
CREATE TABLE email_embeddings (
  id UUID PRIMARY KEY,
  email_id TEXT,
  embedding vector(1536),
  content TEXT
);
-- Index for fast search
CREATE INDEX ON email_embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

*End of Specification — Version 1.0*
*This document covers every screen, component, interaction, color, typography, AI feature, and layout rule needed to implement the Corsair Productivity OS from scratch.*