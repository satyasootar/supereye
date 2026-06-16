import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { calendarEvents, dailyBriefs, emailEventLinks, emails } from '@/lib/db/schema';
import { getTriageSummary } from '@/lib/mail/triage';
import { getActivePluginStatuses, getConnectedPluginIds } from '@/lib/plugins/integrations';
import { extractMeetUrlFromLocation } from './extract-links';
import { fetchBriefGithubData } from './github-data';
import { ensureEmailInsightsForUser } from './insights';
import type {
  BriefActionItem,
  BriefEmailInsight,
  BriefEventItem,
  BriefGithubItem,
  BriefPayload,
  EmailInsightCategory,
} from './types';

function briefDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function mapEmailRow(row: typeof emails.$inferSelect): BriefEmailInsight {
  return {
    id: row.googleMessageId,
    subject: row.subject,
    sender: row.fromAddress,
    snippet: row.snippet,
    category: row.insightCategory ?? 'fyi',
    insightSummary: row.insightSummary,
    priorityTier: row.priorityTier ?? null,
    priorityReason: row.priorityReason ?? null,
    links: (row.extractedLinks as BriefEmailInsight['links']) ?? [],
    otps: (row.extractedOtps as BriefEmailInsight['otps']) ?? [],
    receivedAt: row.internalDate?.toISOString() ?? null,
  };
}

function buildActionItems(
  urgentEmails: BriefEmailInsight[],
  todayEvents: BriefEventItem[],
  otpEmails: BriefEmailInsight[],
  githubItems: BriefGithubItem[] = []
): BriefActionItem[] {
  const items: BriefActionItem[] = [];
  const now = Date.now();

  for (const event of todayEvents) {
    const start = new Date(event.startTime).getTime();
    const mins = event.minutesUntilStart ?? 0;
    if (event.meetUrl && mins >= -15 && mins <= 120) {
      items.push({
        id: `join-${event.id}`,
        kind: 'join_meeting',
        title: event.isHappeningNow ? `Join now: ${event.title}` : `Upcoming: ${event.title}`,
        description:
          mins <= 0
            ? 'Happening now'
            : mins < 60
              ? `Starts in ${mins} min`
              : `Starts at ${new Date(event.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
        priority: event.isHappeningNow ? 100 : Math.max(40, 90 - mins),
        sourcePlugin: 'calendar',
        meetUrl: event.meetUrl,
        eventId: event.id,
        href: event.meetUrl,
      });
    } else if (start > now && mins <= 180) {
      items.push({
        id: `prep-${event.id}`,
        kind: 'prepare_event',
        title: `Prepare for ${event.title}`,
        description: `Starts in ${mins} min`,
        priority: Math.max(30, 70 - Math.floor(mins / 3)),
        sourcePlugin: 'calendar',
        eventId: event.id,
        href: event.htmlLink ?? undefined,
      });
    }
  }

  for (const email of urgentEmails.slice(0, 5)) {
    const meet = email.links[0];
    if (meet) {
      items.push({
        id: `email-meet-${email.id}`,
        kind: 'join_meeting',
        title: email.subject || 'Join meeting from email',
        description: email.insightSummary ?? email.sender ?? undefined,
        priority: 85,
        sourcePlugin: 'email',
        meetUrl: meet.url,
        emailId: email.id,
        href: meet.url,
      });
    } else {
      items.push({
        id: `urgent-${email.id}`,
        kind: 'reply_email',
        title: email.subject || 'Urgent email',
        description: email.priorityReason ?? email.snippet ?? undefined,
        priority: 80,
        sourcePlugin: 'email',
        emailId: email.id,
        href: `/workspace?email=${email.id}`,
      });
    }
  }

  for (const email of otpEmails.slice(0, 3)) {
    const code = email.otps[0]?.code;
    if (!code) continue;
    items.push({
      id: `otp-${email.id}`,
      kind: 'copy_otp',
      title: `OTP from ${email.sender?.split('<')[0]?.trim() || 'sender'}`,
      description: email.subject ?? undefined,
      priority: 75,
      sourcePlugin: 'email',
      otpCode: code,
      emailId: email.id,
    });
  }

  for (const item of githubItems.slice(0, 4)) {
    const label = item.kind === 'pull' ? 'Review PR' : 'Triage issue';
    items.push({
      id: `github-${item.kind}-${item.repoFullName}-${item.number}`,
      kind: 'read_email',
      title: `${label}: ${item.title}`,
      description: `${item.repoFullName} #${item.number}${item.authorLogin ? ` · @${item.authorLogin}` : ''}`,
      priority: item.kind === 'pull' ? 70 : 65,
      sourcePlugin: 'github',
      href: item.htmlUrl ?? undefined,
    });
  }

  return items.sort((a, b) => b.priority - a.priority).slice(0, 12);
}

export async function buildBriefPayload(
  userId: string,
  options?: { skipInsightScan?: boolean }
): Promise<BriefPayload> {
  const plugins = await getActivePluginStatuses(userId);
  const connectedPluginIds = await getConnectedPluginIds(userId);
  const hasEmail = connectedPluginIds.includes('email');
  const hasCalendar = connectedPluginIds.includes('calendar');
  const hasGithub = connectedPluginIds.includes('github');

  if (hasEmail && !options?.skipInsightScan) {
    await ensureEmailInsightsForUser(userId);
  }

  const triage = hasEmail
    ? await getTriageSummary(userId)
    : { urgent: 0, canWait: 0, pending: 0 };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const endUpcoming = new Date();
  endUpcoming.setDate(endUpcoming.getDate() + 2);
  endUpcoming.setHours(23, 59, 59, 999);

  let mappedEmails: BriefEmailInsight[] = [];
  let unreadCount = 0;

  if (hasEmail) {
    const since = new Date();
    since.setDate(since.getDate() - 3);

    const emailRows = await db
      .select()
      .from(emails)
      .where(
        and(
          eq(emails.userId, userId),
          eq(emails.isArchived, false),
          gte(emails.internalDate, since),
          sql`(${emails.labelIds} @> '["INBOX"]'::jsonb OR ${emails.labelIds} IS NULL)`
        )
      )
      .orderBy(sql`${emails.internalDate} DESC`)
      .limit(50);

    unreadCount = emailRows.filter((e) => !e.isRead).length;
    mappedEmails = emailRows.map(mapEmailRow);
  }

  const emailsByCategory: Partial<Record<EmailInsightCategory, BriefEmailInsight[]>> = {};
  for (const email of mappedEmails) {
    const list = emailsByCategory[email.category] ?? [];
    list.push(email);
    emailsByCategory[email.category] = list;
  }

  const urgentEmails = mappedEmails
    .filter((e) => e.priorityTier === 'urgent')
    .sort((a, b) => (b.receivedAt ?? '').localeCompare(a.receivedAt ?? ''));

  let todayEvents: BriefEventItem[] = [];
  let upcomingEvents: BriefEventItem[] = [];

  if (hasCalendar) {
    const eventRows = await db
      .select({
        event: calendarEvents,
        linkedEmailId: emails.googleMessageId,
      })
      .from(calendarEvents)
      .leftJoin(emailEventLinks, eq(calendarEvents.id, emailEventLinks.eventId))
      .leftJoin(emails, eq(emailEventLinks.emailId, emails.id))
      .where(
        and(
          eq(calendarEvents.userId, userId),
          gte(calendarEvents.startTime, startOfDay),
          lte(calendarEvents.startTime, endUpcoming)
        )
      )
      .orderBy(asc(calendarEvents.startTime));

    const now = Date.now();
    const mapEvent = (row: (typeof eventRows)[number]): BriefEventItem => {
      const start = row.event.startTime!;
      const end = row.event.endTime;
      const startMs = start.getTime();
      const endMs = end?.getTime() ?? startMs + 30 * 60_000;
      const meetUrl =
        extractMeetUrlFromLocation(row.event.location) ??
        extractMeetUrlFromLocation(row.event.description ?? undefined);

      return {
        id: row.event.googleEventId,
        title: row.event.title,
        startTime: start.toISOString(),
        endTime: end?.toISOString() ?? null,
        location: row.event.location,
        meetUrl,
        htmlLink: row.event.htmlLink,
        linkedEmailId: row.linkedEmailId,
        minutesUntilStart: Math.round((startMs - now) / 60_000),
        isHappeningNow: now >= startMs && now <= endMs,
      };
    };

    const allEvents = eventRows.map(mapEvent);
    todayEvents = allEvents.filter((e) => {
      const d = new Date(e.startTime);
      return d >= startOfDay && d <= endOfDay;
    });
    upcomingEvents = allEvents.filter((e) => new Date(e.startTime) > endOfDay);
  }

  const github = hasGithub ? await fetchBriefGithubData(userId) : null;

  const otpEmails = emailsByCategory.otp ?? [];
  const bankEmails = emailsByCategory.bank ?? [];

  const actionItems = buildActionItems(
    urgentEmails,
    todayEvents,
    [...otpEmails, ...(emailsByCategory.meeting ?? [])],
    github?.attentionItems ?? []
  );

  const hour = new Date().getHours();

  return {
    generatedAt: new Date().toISOString(),
    briefDate: briefDateKey(),
    narrative: null,
    greeting: greetingForHour(hour),
    actionItems,
    triage,
    emailsByCategory,
    urgentEmails,
    todayEvents,
    upcomingEvents,
    plugins,
    connectedPluginIds,
    github,
    stats: {
      unreadInbox: hasEmail ? unreadCount : 0,
      meetingsToday: hasCalendar ? todayEvents.length : 0,
      otpsToday: hasEmail ? otpEmails.length : 0,
      bankAlerts: hasEmail ? bankEmails.length : 0,
      openPulls: github?.stats.openPulls ?? 0,
      openIssues: github?.stats.openIssues ?? 0,
      repoCount: github?.stats.repoCount ?? 0,
    },
  };
}

export async function getCachedBrief(userId: string): Promise<BriefPayload | null> {
  const date = briefDateKey();
  const [row] = await db
    .select()
    .from(dailyBriefs)
    .where(and(eq(dailyBriefs.userId, userId), eq(dailyBriefs.briefDate, date)))
    .limit(1);

  if (!row?.snapshot) return null;
  return row.snapshot as unknown as BriefPayload;
}

export async function saveBriefCache(
  userId: string,
  payload: BriefPayload,
  narrative: string | null
) {
  const date = payload.briefDate;
  const now = new Date();

  await db
    .insert(dailyBriefs)
    .values({
      userId,
      briefDate: date,
      narrative,
      snapshot: payload as unknown as Record<string, unknown>,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [dailyBriefs.userId, dailyBriefs.briefDate],
      set: {
        narrative,
        snapshot: payload as unknown as Record<string, unknown>,
        updatedAt: now,
      },
    });
}
