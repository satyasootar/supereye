import { NextRequest, NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { getGithubApi } from '@/lib/github/client';
import { fetchGithubOverview } from '@/lib/github/fetch';
import type { GithubInboxItem } from '@/lib/github/types';

export async function GET(request: NextRequest) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const filter = request.nextUrl.searchParams.get('filter') ?? 'all';

  try {
    const api = getGithubApi(session.user.id);
    const overview = await fetchGithubOverview(api, 15);

    const items: GithubInboxItem[] = [];

    if (filter === 'all' || filter === 'pulls') {
      for (const pull of overview.recentPulls) {
        items.push({ kind: 'pull', ...pull });
      }
    }

    if (filter === 'all' || filter === 'issues') {
      for (const issue of overview.recentIssues) {
        items.push({ kind: 'issue', ...issue });
      }
    }

    items.sort(
      (a, b) =>
        new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()
    );

    return NextResponse.json({ items });
  } catch (error) {
    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
