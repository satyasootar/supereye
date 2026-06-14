import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Eye, Mail, Calendar, Keyboard, Sparkles, Shield, ArrowRight, CheckCircle2, Moon, Sun, ArrowUpRight } from 'lucide-react';

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  return (
    <div className="relative min-h-screen bg-bg-app text-text-primary overflow-x-hidden flex flex-col justify-between">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-app/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue text-white shadow-md shadow-accent-blue/20">
              <Eye className="h-5 w-5" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-text-primary">
              Supereye
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#architecture" className="hover:text-text-primary transition-colors">Architecture</a>
            <a href="#shortcuts" className="hover:text-text-primary transition-colors">Shortcuts</a>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/workspace"
                className="flex items-center gap-2 rounded-xl bg-accent-blue px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-blue-dim active:scale-[0.98] shadow-sm"
              >
                Go to Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl bg-text-primary px-4 py-2 text-sm font-medium text-bg-app transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Sign In
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto max-w-7xl px-6 py-12 md:py-20 flex flex-col gap-20">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-border bg-bg-highlight/50 text-xs font-semibold text-accent-blue-dim animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Driven Workspace Agent</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black tracking-tight leading-[1.1] text-text-primary">
            Your daily command center.{' '}
            <span className="text-accent-blue bg-gradient-to-r from-accent-blue to-accent-blue-dim bg-clip-text">
              Reimagined.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl">
            Bring your inbox, calendar, and workflows into one high-performance, keyboard-first dashboard. Supercharge your productivity with local AI integration.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center">
            {isLoggedIn ? (
              <Link
                href="/workspace"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-blue px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent-blue/10 hover:bg-accent-blue-dim transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Open Workspace
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-text-primary px-6 py-3.5 text-base font-semibold text-bg-app shadow-lg hover:opacity-90 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-base/80 px-6 py-3.5 text-base font-semibold text-text-secondary hover:bg-bg-highlight/50 transition-all active:scale-[0.98]"
            >
              Learn More
            </a>
          </div>
        </section>

        {/* Dynamic UI Preview */}
        <section className="relative w-full rounded-2xl border border-border bg-bg-base shadow-2xl overflow-hidden aspect-[16/10] max-w-5xl mx-auto flex flex-col">
          {/* Mock App Window Header */}
          <div className="flex items-center justify-between border-b border-border bg-bg-surface px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-border-strong/50" />
              <div className="h-3 w-3 rounded-full bg-border-strong/30" />
              <div className="h-3 w-3 rounded-full bg-border-strong/20" />
            </div>
            <div className="text-xs font-mono text-text-muted bg-bg-app px-3 py-1 rounded border border-border-subtle">
              supereye.app/workspace
            </div>
            <div className="w-12" />
          </div>

          {/* Mock Workspace Body */}
          <div className="flex-1 flex overflow-hidden text-[13px]">
            {/* Sidebar */}
            <div className="w-[18%] border-r border-border bg-bg-surface p-3 hidden sm:flex flex-col gap-4">
              <div className="h-5 bg-border-default/45 rounded w-3/4" />
              <div className="flex flex-col gap-2">
                <div className="h-8 bg-bg-highlight/60 border-l-2 border-accent-blue rounded px-2 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-accent-blue" />
                  <span className="font-semibold text-accent-blue">Inbox</span>
                </div>
                <div className="h-8 rounded px-2 flex items-center gap-2 text-text-secondary">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Calendar</span>
                </div>
                <div className="h-8 rounded px-2 flex items-center gap-2 text-text-secondary">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Integrations</span>
                </div>
              </div>
            </div>

            {/* List Pane */}
            <div className="w-full sm:w-[32%] border-r border-border p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-border-default/50 rounded w-1/3" />
                <div className="h-4 bg-border-default/30 rounded w-8" />
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  { from: 'Google Calendar', subj: 'Project sync tomorrow', time: '10:42 AM', label: 'Work' },
                  { from: 'Antigravity AI', subj: 'AI integration plan approved', time: 'Yesterday', label: 'Code' },
                  { from: 'Corsair webhook', subj: 'Gmail resync completed successfully', time: '2 days ago', label: 'System' }
                ].map((item, idx) => (
                  <div key={idx} className="p-2 border border-border-subtle rounded-lg bg-bg-app flex flex-col gap-1">
                    <div className="flex justify-between font-medium">
                      <span>{item.from}</span>
                      <span className="text-[11px] text-text-muted">{item.time}</span>
                    </div>
                    <div className="text-[12px] text-text-secondary truncate">{item.subj}</div>
                    <span className="inline-block text-[10px] bg-bg-highlight text-accent-blue-dim px-1.5 py-0.5 rounded w-max">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reader Pane */}
            <div className="hidden sm:flex flex-1 p-4 flex-col gap-4 bg-bg-base justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div>
                    <h4 className="font-bold text-text-primary text-[14px]">Project sync tomorrow</h4>
                    <p className="text-xs text-text-secondary">From: Google Calendar &lt;noreply@google.com&gt;</p>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-6 w-6 rounded bg-bg-surface border border-border flex items-center justify-center text-text-muted">✓</div>
                    <div className="h-6 w-6 rounded bg-bg-surface border border-border flex items-center justify-center text-text-muted">🗑</div>
                  </div>
                </div>
                <div className="space-y-2 text-text-secondary pt-2">
                  <div className="h-3.5 bg-border-default/20 rounded w-full" />
                  <div className="h-3.5 bg-border-default/20 rounded w-[90%]" />
                  <div className="h-3.5 bg-border-default/20 rounded w-[95%]" />
                  <div className="h-3.5 bg-border-default/20 rounded w-[40%]" />
                </div>
              </div>

              {/* AI Assistant panel */}
              <div className="border border-border bg-bg-highlight/40 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-accent-blue font-semibold text-xs">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Synthesizer</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  This calendar invite is for the weekly sync on <strong>June 15 at 2:00 PM</strong>. Your calendar has no conflicts at this time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="flex flex-col gap-10 scroll-mt-20">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-heading font-extrabold tracking-tight text-text-primary">
              Designed for Flow, Built for Speed
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Supereye aggregates critical productivity utilities into an uncompromising interface optimized for developers and professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-border bg-bg-base/80 hover:bg-bg-highlight/20 transition-all flex flex-col gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-text-primary">Unified Inbox</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Connect and sync multiple accounts. View, archive, and delete emails with minimal latency and optimized list layouts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-border bg-bg-base/80 hover:bg-bg-highlight/20 transition-all flex flex-col gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-text-primary">Fluid Calendar</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Inspect calendars side-by-side or overlays. Create events, accept invites, and check availability instantaneously.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-border bg-bg-base/80 hover:bg-bg-highlight/20 transition-all flex flex-col gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-text-primary">Local AI Integration</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Analyze and draft messages or event descriptions using smart context synthesis powered securely by localized model endpoints.
              </p>
            </div>
          </div>
        </section>

        {/* Shortcuts section */}
        <section id="shortcuts" className="rounded-2xl border border-border bg-bg-base p-8 flex flex-col md:flex-row gap-8 items-center scroll-mt-20">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-1.5 text-accent-blue font-semibold text-xs uppercase tracking-wider">
              <Keyboard className="h-4 w-4" />
              <span>Keyboard First</span>
            </div>
            <h3 className="text-2xl font-heading font-bold tracking-tight text-text-primary">
              Never touch your mouse again.
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Every operation from switching panes, opening details, archiving, and composing messages is mapped to professional shortcuts. Boost keyboard efficiency immediately.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full md:w-auto flex-shrink-0">
            {[
              { keys: ['⌘', 'K'], desc: 'Command Palette' },
              { keys: ['C'], desc: 'Compose Email' },
              { keys: ['E'], desc: 'Archive Email' },
              { keys: ['J', 'K'], desc: 'Navigate List' }
            ].map((shortcut, idx) => (
              <div key={idx} className="p-3 border border-border-subtle rounded-xl bg-bg-surface flex items-center justify-between gap-6">
                <span className="text-xs text-text-secondary font-medium">{shortcut.desc}</span>
                <div className="flex gap-1">
                  {shortcut.keys.map((k, kIdx) => (
                    <kbd key={kIdx} className="px-1.5 py-0.5 border border-border-strong/50 bg-bg-base rounded font-mono text-[11px] text-text-primary shadow-sm">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="flex flex-col md:flex-row gap-12 items-center border-t border-border-subtle pt-16 scroll-mt-20">
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-heading font-extrabold tracking-tight text-text-primary">
              Secured with Corsair
            </h2>
            <p className="text-text-secondary leading-relaxed">
              Supereye separates auth and service connections. Authentication occurs locally via standard OAuth protocols. APIs connect through secure, local plugins matching the Corsair architecture — guaranteeing your data resides exactly where you intend.
            </p>
            <ul className="space-y-2.5 pt-2">
              {[
                'Google-authorized API integration',
                'Isolated local data persistence via Postgres / Drizzle',
                'Live synchronization with Server-Sent Events',
                'Lightweight and privacy-preserving client design'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <CheckCircle2 className="h-4.5 w-4.5 text-accent-blue flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full md:w-[45%] aspect-square max-w-sm rounded-2xl border border-border bg-bg-surface p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-text-muted">system-status.json</span>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
            </div>

            <div className="space-y-4 my-6">
              {[
                { label: 'Google API Sync', status: 'Connected' },
                { label: 'Local SQLite/PG DB', status: 'Online' },
                { label: 'Corsair Integration Client', status: 'Ready' }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-border-subtle pb-2">
                  <span className="text-xs font-medium text-text-secondary">{item.label}</span>
                  <span className="text-[11px] font-mono bg-bg-highlight text-accent-blue px-2 py-0.5 rounded font-semibold">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[11px] font-mono text-text-muted text-center border-t border-border-subtle pt-3">
              Last synced: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-bg-surface py-8 text-center text-xs text-text-muted w-full">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Supereye Command Center. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-text-primary">Docs</a>
            <a href="#" className="hover:text-text-primary">Security</a>
            <a href="#" className="hover:text-text-primary">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
