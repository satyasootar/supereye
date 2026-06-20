import { db } from '@/lib/db';
import { agentMessages, agentThreads } from '@/lib/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';

export type AgentThreadSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  preview?: string;
};

export type AgentThreadMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

function titleFromMessage(content: string): string {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New chat';
  return cleaned.length > 56 ? `${cleaned.slice(0, 56)}…` : cleaned;
}

export async function listThreadsForUser(userId: string): Promise<AgentThreadSummary[]> {
  const threads = await db
    .select()
    .from(agentThreads)
    .where(eq(agentThreads.userId, userId))
    .orderBy(desc(agentThreads.lastMessageAt));

  const summaries: AgentThreadSummary[] = [];

  for (const thread of threads) {
    const [lastMessage] = await db
      .select({ content: agentMessages.content })
      .from(agentMessages)
      .where(eq(agentMessages.threadId, thread.id))
      .orderBy(desc(agentMessages.createdAt))
      .limit(1);

    summaries.push({
      id: thread.id,
      title: thread.title,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      lastMessageAt: thread.lastMessageAt.toISOString(),
      preview: lastMessage?.content?.slice(0, 120),
    });
  }

  return summaries;
}

export async function createThreadForUser(userId: string, title?: string) {
  const [thread] = await db
    .insert(agentThreads)
    .values({
      userId,
      title: title?.trim() || 'New chat',
    })
    .returning();

  return thread;
}

export async function getThreadForUser(userId: string, threadId: string) {
  const [thread] = await db
    .select()
    .from(agentThreads)
    .where(and(eq(agentThreads.id, threadId), eq(agentThreads.userId, userId)))
    .limit(1);

  return thread ?? null;
}

export async function getThreadMessages(threadId: string): Promise<AgentThreadMessage[]> {
  const rows = await db
    .select()
    .from(agentMessages)
    .where(eq(agentMessages.threadId, threadId))
    .orderBy(asc(agentMessages.createdAt));

  return rows.map((row) => ({
    id: row.id,
    role: row.role as AgentThreadMessage['role'],
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getThreadWithMessages(userId: string, threadId: string) {
  const thread = await getThreadForUser(userId, threadId);
  if (!thread) return null;

  const messages = await getThreadMessages(threadId);
  return {
    thread: {
      id: thread.id,
      title: thread.title,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      lastMessageAt: thread.lastMessageAt.toISOString(),
    },
    messages,
  };
}

export async function addMessageToThread(
  threadId: string,
  role: AgentThreadMessage['role'],
  content: string
) {
  const [message] = await db
    .insert(agentMessages)
    .values({ threadId, role, content })
    .returning();

  const now = new Date();
  await db
    .update(agentThreads)
    .set({ updatedAt: now, lastMessageAt: now })
    .where(eq(agentThreads.id, threadId));

  return message;
}

export async function ensureThreadTitleFromFirstMessage(
  threadId: string,
  firstUserMessage: string
) {
  const [thread] = await db
    .select({ title: agentThreads.title })
    .from(agentThreads)
    .where(eq(agentThreads.id, threadId))
    .limit(1);

  if (!thread || (thread.title !== 'New chat' && thread.title.length > 0)) return;

  await db
    .update(agentThreads)
    .set({ title: titleFromMessage(firstUserMessage), updatedAt: new Date() })
    .where(eq(agentThreads.id, threadId));
}

export async function renameThreadForUser(userId: string, threadId: string, title: string) {
  const trimmed = title.trim();
  if (!trimmed) throw new Error('Title is required');

  const [updated] = await db
    .update(agentThreads)
    .set({ title: trimmed.slice(0, 120), updatedAt: new Date() })
    .where(and(eq(agentThreads.id, threadId), eq(agentThreads.userId, userId)))
    .returning();

  if (!updated) throw new Error('Thread not found');
  return updated;
}

export async function deleteThreadForUser(userId: string, threadId: string) {
  const result = await db
    .delete(agentThreads)
    .where(and(eq(agentThreads.id, threadId), eq(agentThreads.userId, userId)))
    .returning({ id: agentThreads.id });

  if (result.length === 0) throw new Error('Thread not found');
  return true;
}

export async function deleteAllThreadsForUser(userId: string): Promise<number> {
  const result = await db
    .delete(agentThreads)
    .where(eq(agentThreads.userId, userId))
    .returning({ id: agentThreads.id });

  return result.length;
}

export async function getOrCreateThread(
  userId: string,
  threadId?: string | null,
  firstMessage?: string
) {
  if (threadId) {
    const existing = await getThreadForUser(userId, threadId);
    if (!existing) throw new Error('Thread not found');
    return existing;
  }

  return createThreadForUser(userId, firstMessage ? titleFromMessage(firstMessage) : undefined);
}
