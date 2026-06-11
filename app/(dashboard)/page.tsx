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
    <div className="flex flex-col gap-10 p-8 max-w-7xl mx-auto w-full">
      {/* Header & Connections Bento */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight font-heading text-foreground">
            Good{' '}
            {new Date().getHours() < 12
              ? 'morning'
              : new Date().getHours() < 18
                ? 'afternoon'
                : 'evening'}
            , {session.user.name?.split(' ')[0] ?? 'there'}.
          </h1>
          <p className="text-base text-muted-foreground">
            Your unified view for today. Focus on what matters.
          </p>
        </div>

        {/* Minimal Connections Status */}
        <div className="flex items-center gap-4 bg-card/40 backdrop-blur-md px-5 py-3 rounded-2xl">
          <div className="flex items-center gap-3 pr-4 border-r border-border/50">
            <Mail className={`h-4 w-4 ${isGmailConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">
              {isGmailConnected ? 'Gmail Active' : (
                <form action="/api/integrations/connect" method="post" className="inline">
                  <input type="hidden" name="plugin" value="gmail" />
                  <button type="submit" className="text-primary hover:underline underline-offset-4">Connect Gmail</button>
                </form>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className={`h-4 w-4 ${isCalendarConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">
              {isCalendarConnected ? 'Calendar Active' : (
                <form action="/api/integrations/connect" method="post" className="inline">
                  <input type="hidden" name="plugin" value="googlecalendar" />
                  <button type="submit" className="text-primary hover:underline underline-offset-4">Connect Calendar</button>
                </form>
              )}
            </span>
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
