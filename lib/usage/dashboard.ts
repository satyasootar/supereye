import { db } from '@/lib/db';
import {
  agentMessages,
  agentThreads,
  aiUsageEvents,
  emails,
} from '@/lib/db/schema';
import { and, desc, eq, gte, sql } from 'drizzle-orm';

export type UsageDashboard = {
  chat: {
    totalThreads: number;
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    messagesThisWeek: number;
  };
  tokens: {
    total: number;
    input: number;
    output: number;
    byFeature: Array<{
      feature: string;
      totalTokens: number;
      inputTokens: number;
      outputTokens: number;
      count: number;
    }>;
    last7Days: Array<{ date: string; totalTokens: number }>;
  };
  emailAi: {
    classifiedTotal: number;
    urgentCount: number;
    canWaitCount: number;
    pendingCount: number;
    classifiedThisWeek: number;
  };
  agentEmail: {
    sentViaAgent: number;
    sentThisWeek: number;
  };
  recentThreads: Array<{
    id: string;
    title: string;
    messageCount: number;
    lastMessageAt: string;
    createdAt: string;
  }>;
};

function weekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

export async function getUserUsageDashboard(
  userId: string
): Promise<UsageDashboard> {
  const sinceWeek = weekAgo();

  const [threadCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(agentThreads)
    .where(eq(agentThreads.userId, userId));

  const [messageStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      userCount: sql<number>`count(*) filter (where ${agentMessages.role} = 'user')::int`,
      assistantCount: sql<number>`count(*) filter (where ${agentMessages.role} = 'assistant')::int`,
      weekCount: sql<number>`count(*) filter (where ${agentMessages.createdAt} >= ${sinceWeek})::int`,
    })
    .from(agentMessages)
    .innerJoin(agentThreads, eq(agentMessages.threadId, agentThreads.id))
    .where(eq(agentThreads.userId, userId));

  const tokenByFeature = await db
    .select({
      feature: aiUsageEvents.feature,
      totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)::int`,
      inputTokens: sql<number>`coalesce(sum(${aiUsageEvents.inputTokens}), 0)::int`,
      outputTokens: sql<number>`coalesce(sum(${aiUsageEvents.outputTokens}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(aiUsageEvents)
    .where(eq(aiUsageEvents.userId, userId))
    .groupBy(aiUsageEvents.feature);

  const [tokenTotals] = await db
    .select({
      total: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)::int`,
      input: sql<number>`coalesce(sum(${aiUsageEvents.inputTokens}), 0)::int`,
      output: sql<number>`coalesce(sum(${aiUsageEvents.outputTokens}), 0)::int`,
    })
    .from(aiUsageEvents)
    .where(eq(aiUsageEvents.userId, userId));

  const tokenLast7Days = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${aiUsageEvents.createdAt}), 'YYYY-MM-DD')`,
      totalTokens: sql<number>`coalesce(sum(${aiUsageEvents.totalTokens}), 0)::int`,
    })
    .from(aiUsageEvents)
    .where(
      and(
        eq(aiUsageEvents.userId, userId),
        gte(aiUsageEvents.createdAt, sinceWeek)
      )
    )
    .groupBy(sql`date_trunc('day', ${aiUsageEvents.createdAt})`)
    .orderBy(sql`date_trunc('day', ${aiUsageEvents.createdAt})`);

  const [emailStats] = await db
    .select({
      classifiedTotal: sql<number>`count(*) filter (where ${emails.priorityTier} is not null)::int`,
      urgentCount: sql<number>`count(*) filter (where ${emails.priorityTier} = 'urgent')::int`,
      canWaitCount: sql<number>`count(*) filter (where ${emails.priorityTier} = 'can_wait')::int`,
      pendingCount: sql<number>`count(*) filter (where ${emails.priorityTier} is null and ${emails.isRead} = false and ${emails.isArchived} = false)::int`,
      classifiedThisWeek: sql<number>`count(*) filter (where ${emails.priorityClassifiedAt} >= ${sinceWeek})::int`,
    })
    .from(emails)
    .where(eq(emails.userId, userId));

  const agentEmailStats = tokenByFeature.find(
    (row) => row.feature === 'agent_email_send'
  );

  const agentEmailWeek = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(aiUsageEvents)
    .where(
      and(
        eq(aiUsageEvents.userId, userId),
        eq(aiUsageEvents.feature, 'agent_email_send'),
        gte(aiUsageEvents.createdAt, sinceWeek)
      )
    );

  const recentThreadsRaw = await db
    .select({
      id: agentThreads.id,
      title: agentThreads.title,
      lastMessageAt: agentThreads.lastMessageAt,
      createdAt: agentThreads.createdAt,
      messageCount: sql<number>`count(${agentMessages.id})::int`,
    })
    .from(agentThreads)
    .leftJoin(agentMessages, eq(agentMessages.threadId, agentThreads.id))
    .where(eq(agentThreads.userId, userId))
    .groupBy(agentThreads.id)
    .orderBy(desc(agentThreads.lastMessageAt))
    .limit(8);

  return {
    chat: {
      totalThreads: threadCountRow?.count ?? 0,
      totalMessages: messageStats?.total ?? 0,
      userMessages: messageStats?.userCount ?? 0,
      assistantMessages: messageStats?.assistantCount ?? 0,
      messagesThisWeek: messageStats?.weekCount ?? 0,
    },
    tokens: {
      total: tokenTotals?.total ?? 0,
      input: tokenTotals?.input ?? 0,
      output: tokenTotals?.output ?? 0,
      byFeature: tokenByFeature.map((row) => ({
        feature: row.feature,
        totalTokens: row.totalTokens,
        inputTokens: row.inputTokens,
        outputTokens: row.outputTokens,
        count: row.count,
      })),
      last7Days: tokenLast7Days.map((row) => ({
        date: row.date,
        totalTokens: row.totalTokens,
      })),
    },
    emailAi: {
      classifiedTotal: emailStats?.classifiedTotal ?? 0,
      urgentCount: emailStats?.urgentCount ?? 0,
      canWaitCount: emailStats?.canWaitCount ?? 0,
      pendingCount: emailStats?.pendingCount ?? 0,
      classifiedThisWeek: emailStats?.classifiedThisWeek ?? 0,
    },
    agentEmail: {
      sentViaAgent: agentEmailStats?.count ?? 0,
      sentThisWeek: agentEmailWeek[0]?.count ?? 0,
    },
    recentThreads: recentThreadsRaw.map((thread) => ({
      id: thread.id,
      title: thread.title,
      messageCount: thread.messageCount,
      lastMessageAt: thread.lastMessageAt.toISOString(),
      createdAt: thread.createdAt.toISOString(),
    })),
  };
}
