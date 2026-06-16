import { getGithubApi } from '@/lib/github/client';
import { fetchGithubOverview } from '@/lib/github/fetch';
import type { BriefGithubData } from './types';

export async function fetchBriefGithubData(userId: string): Promise<BriefGithubData | null> {
  try {
    const api = getGithubApi(userId);
    const overview = await fetchGithubOverview(api, 8);

    const attentionItems = [
      ...overview.recentPulls.slice(0, 8).map((pull) => ({
        kind: 'pull' as const,
        number: pull.number,
        title: pull.title,
        repoFullName: pull.repoFullName,
        authorLogin: pull.authorLogin,
        updatedAt: pull.updatedAt,
        htmlUrl: pull.htmlUrl,
        labels: pull.labels,
        draft: pull.draft,
      })),
      ...overview.recentIssues.slice(0, 8).map((issue) => ({
        kind: 'issue' as const,
        number: issue.number,
        title: issue.title,
        repoFullName: issue.repoFullName,
        authorLogin: issue.authorLogin,
        updatedAt: issue.updatedAt,
        htmlUrl: issue.htmlUrl,
        labels: issue.labels,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
      )
      .slice(0, 10);

    return {
      stats: {
        repoCount: overview.stats.repoCount,
        openPulls: overview.stats.openPulls,
        openIssues: overview.stats.openIssues,
      },
      attentionItems,
    };
  } catch (error) {
    console.error('[daily-brief] GitHub data fetch failed:', error);
    return null;
  }
}
