import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  calendarEvents,
  emails,
  integrationCache,
} from '@/lib/db/schema';
import { getConnectedPluginIds } from '@/lib/plugins/integrations';
import type { SuperSearchKind, SuperSearchResult } from './types';

const EMAIL_BODY_PREVIEW = 8000;

function emailDocumentSql() {
  return sql`to_tsvector('english',
    coalesce(${emails.subject}, '') || ' ' ||
    coalesce(${emails.snippet}, '') || ' ' ||
    coalesce(${emails.fromAddress}, '') || ' ' ||
    left(coalesce(${emails.body}, ''), ${EMAIL_BODY_PREVIEW})
  )`;
}

function calendarDocumentSql() {
  return sql`to_tsvector('english',
    coalesce(${calendarEvents.title}, '') || ' ' ||
    coalesce(${calendarEvents.description}, '') || ' ' ||
    coalesce(${calendarEvents.location}, '')
  )`;
}

function matchesKeyword(haystack: string, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return false;
  const text = haystack.toLowerCase();
  return terms.every((term) => text.includes(term));
}

function scoreKeyword(haystack: string, query: string): number {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = haystack.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (text.startsWith(term)) score += 4;
    else if (text.includes(` ${term}`)) score += 2;
    else if (text.includes(term)) score += 1;
  }
  return score;
}

async function searchEmails(userId: string, query: string): Promise<SuperSearchResult[]> {
  const doc = emailDocumentSql();
  const tsQuery = sql`websearch_to_tsquery('english', ${query})`;

  try {
    const rows = await db
      .select({
        id: emails.googleMessageId,
        subject: emails.subject,
        fromAddress: emails.fromAddress,
        snippet: emails.snippet,
        internalDate: emails.internalDate,
        rank: sql<number>`ts_rank(${doc}, ${tsQuery})`,
      })
      .from(emails)
      .where(
        and(
          eq(emails.userId, userId),
          eq(emails.isArchived, false),
          sql`${doc} @@ ${tsQuery}`
        )
      )
      .orderBy(sql`ts_rank(${doc}, ${tsQuery}) DESC`, desc(emails.internalDate))
      .limit(12);

    return rows.map((row) => ({
      id: row.id,
      kind: 'email' as const,
      pluginId: 'email',
      title: row.subject || '(No subject)',
      subtitle: row.fromAddress ?? undefined,
      date: row.internalDate?.toISOString() ?? null,
      meta: { snippet: row.snippet ?? undefined },
    }));
  } catch {
    const pattern = `%${query}%`;
    const rows = await db
      .select({
        id: emails.googleMessageId,
        subject: emails.subject,
        fromAddress: emails.fromAddress,
        snippet: emails.snippet,
        internalDate: emails.internalDate,
      })
      .from(emails)
      .where(
        and(
          eq(emails.userId, userId),
          eq(emails.isArchived, false),
          or(
            ilike(emails.subject, pattern),
            ilike(emails.snippet, pattern),
            ilike(emails.fromAddress, pattern),
            ilike(emails.body, pattern)
          )
        )
      )
      .orderBy(desc(emails.internalDate))
      .limit(12);

    return rows.map((row) => ({
      id: row.id,
      kind: 'email',
      pluginId: 'email',
      title: row.subject || '(No subject)',
      subtitle: row.fromAddress ?? undefined,
      date: row.internalDate?.toISOString() ?? null,
      meta: { snippet: row.snippet ?? undefined },
    }));
  }
}

async function searchCalendar(userId: string, query: string): Promise<SuperSearchResult[]> {
  const doc = calendarDocumentSql();
  const tsQuery = sql`websearch_to_tsquery('english', ${query})`;

  try {
    const rows = await db
      .select({
        id: calendarEvents.googleEventId,
        title: calendarEvents.title,
        location: calendarEvents.location,
        startTime: calendarEvents.startTime,
        rank: sql<number>`ts_rank(${doc}, ${tsQuery})`,
      })
      .from(calendarEvents)
      .where(and(eq(calendarEvents.userId, userId), sql`${doc} @@ ${tsQuery}`))
      .orderBy(sql`ts_rank(${doc}, ${tsQuery}) DESC`, desc(calendarEvents.startTime))
      .limit(8);

    return rows.map((row) => ({
      id: row.id,
      kind: 'calendar',
      pluginId: 'calendar',
      title: row.title || '(Untitled event)',
      subtitle: row.location ?? undefined,
      date: row.startTime?.toISOString() ?? null,
    }));
  } catch {
    const pattern = `%${query}%`;
    const rows = await db
      .select({
        id: calendarEvents.googleEventId,
        title: calendarEvents.title,
        location: calendarEvents.location,
        startTime: calendarEvents.startTime,
      })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          or(
            ilike(calendarEvents.title, pattern),
            ilike(calendarEvents.description, pattern),
            ilike(calendarEvents.location, pattern)
          )
        )
      )
      .orderBy(desc(calendarEvents.startTime))
      .limit(8);

    return rows.map((row) => ({
      id: row.id,
      kind: 'calendar',
      pluginId: 'calendar',
      title: row.title || '(Untitled event)',
      subtitle: row.location ?? undefined,
      date: row.startTime?.toISOString() ?? null,
    }));
  }
}

async function searchGithubCache(userId: string, query: string): Promise<SuperSearchResult[]> {
  const rows = await db
    .select({
      cacheKey: integrationCache.cacheKey,
      payload: integrationCache.payload,
    })
    .from(integrationCache)
    .where(
      and(
        eq(integrationCache.userId, userId),
        sql`${integrationCache.cacheKey} like 'github:%'`
      )
    );

  const results: SuperSearchResult[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const payload = row.payload as Record<string, unknown>;

    if (row.cacheKey.startsWith('github:repos:')) {
      const repos = (payload as { repos?: Array<Record<string, unknown>> }).repos ?? [];
      for (const repo of repos) {
        const fullName = String(repo.fullName ?? '');
        const name = String(repo.name ?? fullName);
        const text = `${fullName} ${name} ${repo.description ?? ''}`;
        if (!matchesKeyword(text, query)) continue;
        const id = `repo:${fullName}`;
        if (seen.has(id)) continue;
        seen.add(id);
        results.push({
          id: fullName,
          kind: 'github_repo',
          pluginId: 'github',
          title: fullName,
          subtitle: repo.description ? String(repo.description) : 'Repository',
          date: repo.updatedAt ? String(repo.updatedAt) : null,
          href: repo.htmlUrl ? String(repo.htmlUrl) : null,
        });
      }
    }

    if (row.cacheKey === 'github:overview') {
      const overview = payload as {
        recentPulls?: Array<Record<string, unknown>>;
        recentIssues?: Array<Record<string, unknown>>;
      };

      for (const pull of overview.recentPulls ?? []) {
        const text = `${pull.title} ${pull.repoFullName}`;
        if (!matchesKeyword(text, query)) continue;
        const id = `pull:${pull.repoFullName}:${pull.number}`;
        if (seen.has(id)) continue;
        seen.add(id);
        results.push({
          id,
          kind: 'github_pull',
          pluginId: 'github',
          title: String(pull.title ?? 'Pull request'),
          subtitle: `${pull.repoFullName} #${pull.number}`,
          date: pull.updatedAt ? String(pull.updatedAt) : null,
          href: pull.htmlUrl ? String(pull.htmlUrl) : null,
          meta: {
            repoFullName: String(pull.repoFullName ?? ''),
            number: Number(pull.number ?? 0),
          },
        });
      }

      for (const issue of overview.recentIssues ?? []) {
        const text = `${issue.title} ${issue.repoFullName}`;
        if (!matchesKeyword(text, query)) continue;
        const id = `issue:${issue.repoFullName}:${issue.number}`;
        if (seen.has(id)) continue;
        seen.add(id);
        results.push({
          id,
          kind: 'github_issue',
          pluginId: 'github',
          title: String(issue.title ?? 'Issue'),
          subtitle: `${issue.repoFullName} #${issue.number}`,
          date: issue.updatedAt ? String(issue.updatedAt) : null,
          href: issue.htmlUrl ? String(issue.htmlUrl) : null,
          meta: {
            repoFullName: String(issue.repoFullName ?? ''),
            number: Number(issue.number ?? 0),
          },
        });
      }
    }
  }

  return results
    .sort(
      (a, b) =>
        scoreKeyword(`${b.title} ${b.subtitle ?? ''}`, query) -
        scoreKeyword(`${a.title} ${a.subtitle ?? ''}`, query)
    )
    .slice(0, 10);
}

async function searchDriveCache(userId: string, query: string): Promise<SuperSearchResult[]> {
  const rows = await db
    .select({
      cacheKey: integrationCache.cacheKey,
      payload: integrationCache.payload,
    })
    .from(integrationCache)
    .where(
      and(
        eq(integrationCache.userId, userId),
        sql`${integrationCache.cacheKey} like 'drive:%'`
      )
    );

  const results: SuperSearchResult[] = [];
  const seen = new Set<string>();

  const addItem = (item: Record<string, unknown>, source: string) => {
    const name = String(item.name ?? '');
    if (!name || !matchesKeyword(`${name} ${source}`, query)) return;
    const fileId = String(item.id ?? '');
    if (!fileId || seen.has(fileId)) return;
    seen.add(fileId);
    const isFolder = Boolean(item.isFolder);
    results.push({
      id: fileId,
      kind: isFolder ? 'drive_folder' : 'drive_file',
      pluginId: 'drive',
      title: name,
      subtitle: isFolder ? 'Folder' : 'File',
      date: item.modifiedTime ? String(item.modifiedTime) : null,
      href: item.webViewLink ? String(item.webViewLink) : null,
    });
  };

  for (const row of rows) {
    const payload = row.payload as Record<string, unknown>;

    if (row.cacheKey === 'drive:recent') {
      for (const item of (payload.recent as Array<Record<string, unknown>>) ?? []) {
        addItem(item, 'recent');
      }
      for (const item of (payload.starred as Array<Record<string, unknown>>) ?? []) {
        addItem(item, 'starred');
      }
    }

    if (row.cacheKey.startsWith('drive:folder:')) {
      for (const item of (payload.items as Array<Record<string, unknown>>) ?? []) {
        addItem(item, row.cacheKey);
      }
    }
  }

  return results
    .sort(
      (a, b) =>
        scoreKeyword(b.title, query) - scoreKeyword(a.title, query)
    )
    .slice(0, 10);
}

export async function searchWorkspace(
  userId: string,
  query: string
): Promise<{ results: SuperSearchResult[]; mode: 'fts' | 'keyword' }> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { results: [], mode: 'fts' };
  }

  const connected = await getConnectedPluginIds(userId);
  const tasks: Promise<SuperSearchResult[]>[] = [];

  if (connected.includes('email')) {
    tasks.push(searchEmails(userId, trimmed));
  }
  if (connected.includes('calendar')) {
    tasks.push(searchCalendar(userId, trimmed));
  }
  if (connected.includes('github')) {
    tasks.push(searchGithubCache(userId, trimmed));
  }
  if (connected.includes('drive')) {
    tasks.push(searchDriveCache(userId, trimmed));
  }

  const groups = await Promise.all(tasks);
  const merged = groups.flat();

  const ranked = merged.sort((a, b) => {
    const scoreA = scoreKeyword(`${a.title} ${a.subtitle ?? ''}`, trimmed);
    const scoreB = scoreKeyword(`${b.title} ${b.subtitle ?? ''}`, trimmed);
    if (scoreB !== scoreA) return scoreB - scoreA;
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  return { results: ranked.slice(0, 25), mode: 'fts' };
}

export function superSearchCategory(kind: SuperSearchKind): string {
  switch (kind) {
    case 'email':
      return 'Super Search · Email';
    case 'calendar':
      return 'Super Search · Calendar';
    case 'github_repo':
    case 'github_pull':
    case 'github_issue':
      return 'Super Search · GitHub';
    case 'drive_file':
    case 'drive_folder':
      return 'Super Search · Drive';
    default:
      return 'Super Search';
  }
}
