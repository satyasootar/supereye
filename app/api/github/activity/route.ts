import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { getGithubApi } from '@/lib/github/client';
import { normalizePullRequest, normalizeIssue, normalizeRepo, isPullRequestIssue } from '@/lib/github/normalize';
import type { GithubIssue, GithubPullRequest } from '@/lib/github/types';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const api = getGithubApi(session.user.id);
    const reposResult = await api.repositories.list({
      perPage: 12,
      sort: 'updated',
      direction: 'desc',
    });

    const repos = Array.isArray(reposResult)
      ? reposResult
          .slice(0, 8)
          .map((item) => normalizeRepo(item as Record<string, unknown>))
      : [];

    const pulls: GithubPullRequest[] = [];
    const issues: GithubIssue[] = [];

    await Promise.all(
      repos.map(async (repo) => {
        const [owner, name] = repo.fullName.split('/');
        if (!owner || !name) return;

        try {
          const [pullResult, issueResult] = await Promise.all([
            api.pullRequests.list({
              owner,
              repo: name,
              state: 'open',
              perPage: 5,
              sort: 'updated',
              direction: 'desc',
            }),
            api.issues.list({
              owner,
              repo: name,
              state: 'open',
              perPage: 5,
              sort: 'updated',
              direction: 'desc',
            }),
          ]);

          if (Array.isArray(pullResult)) {
            for (const item of pullResult) {
              pulls.push(
                normalizePullRequest(item as Record<string, unknown>, owner, name)
              );
            }
          }

          if (Array.isArray(issueResult)) {
            for (const item of issueResult) {
              const raw = item as Record<string, unknown>;
              if (isPullRequestIssue(raw)) continue;
              issues.push(normalizeIssue(raw, owner, name));
            }
          }
        } catch {
          // Skip repos we cannot read
        }
      })
    );

    pulls.sort(
      (a, b) =>
        new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
    );
    issues.sort(
      (a, b) =>
        new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
    );

    return NextResponse.json({
      pulls: pulls.slice(0, 20),
      issues: issues.slice(0, 20),
      repos,
    });
  } catch (error) {
    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
