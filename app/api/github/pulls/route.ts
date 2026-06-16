import { NextRequest, NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { getGithubApi } from '@/lib/github/client';
import { normalizePullRequest } from '@/lib/github/normalize';

export async function GET(req: NextRequest) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const owner = req.nextUrl.searchParams.get('owner');
  const repo = req.nextUrl.searchParams.get('repo');
  const state = req.nextUrl.searchParams.get('state') ?? 'open';

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 });
  }

  try {
    const api = getGithubApi(session.user.id);
    const result = await api.pullRequests.list({
      owner,
      repo,
      state,
      perPage: 50,
      sort: 'updated',
      direction: 'desc',
    });

    const pulls = Array.isArray(result)
      ? result.map((item) =>
          normalizePullRequest(item as Record<string, unknown>, owner, repo)
        )
      : [];

    return NextResponse.json({ pulls });
  } catch (error) {
    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
