import { auth } from '@/lib/auth';
import { Mail, Calendar, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db';
import { corsairAccounts, corsairIntegrations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { DailyBrief } from '@/components/daily-brief/daily-brief';

/**
 * Daily Brief — the main dashboard page.
 * Phase 2: Queries connected integrations and displays either connection cards or the Inbox/Calendar UI.
 */
export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // 1. Query the database to see which plugins this user has connected
  const accounts = await db
    .select({ name: corsairIntegrations.name })
    .from(corsairAccounts)
    .innerJoin(corsairIntegrations, eq(corsairAccounts.integrationId, corsairIntegrations.id))
    .where(eq(corsairAccounts.tenantId, session.user.id));
  
  const connectedPlugins = accounts.map((a) => a.name);
  const isGmailConnected = connectedPlugins.includes('gmail');
  const isCalendarConnected = connectedPlugins.includes('googlecalendar');

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* Welcome header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Good{' '}
          {new Date().getHours() < 12
            ? 'morning'
            : new Date().getHours() < 18
              ? 'afternoon'
              : 'evening'}
          , {session.user.name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s your daily brief — everything in one place.
        </p>
      </div>

      {/* Connection cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Gmail connection card */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-border hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent" />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                  <Mail className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Gmail</h3>
                  <p className="text-xs text-muted-foreground">
                    Connect to see your inbox
                  </p>
                </div>
              </div>
              {isGmailConnected && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </div>
            
            {isGmailConnected ? (
              <div className="rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-center text-sm font-medium text-muted-foreground">
                Connected
              </div>
            ) : (
              <form action="/api/integrations/connect" method="post">
                <input type="hidden" name="plugin" value="gmail" />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition-all hover:bg-accent active:scale-[0.98]"
                >
                  Connect Gmail
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Calendar connection card */}
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-border hover:shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent" />
          <div className="relative flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Google Calendar</h3>
                  <p className="text-xs text-muted-foreground">
                    Connect to see your schedule
                  </p>
                </div>
              </div>
              {isCalendarConnected && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </div>

            {isCalendarConnected ? (
              <div className="rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-center text-sm font-medium text-muted-foreground">
                Connected
              </div>
            ) : (
              <form action="/api/integrations/connect" method="post">
                <input type="hidden" name="plugin" value="googlecalendar" />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition-all hover:bg-accent active:scale-[0.98]"
                >
                  Connect Calendar
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Daily Brief placeholder / Main UI */}
      {isGmailConnected || isCalendarConnected ? (
        <DailyBrief isGmailConnected={isGmailConnected} isCalendarConnected={isCalendarConnected} />
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/50 p-12 mt-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-6 w-6 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Daily Brief coming soon</p>
              <p className="text-xs text-muted-foreground">
                Connect Gmail or Calendar above to see your unified view
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
