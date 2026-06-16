import { NextRequest, NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { getGithubApi } from '@/lib/github/client';
import { fetchGithubRepoBundle } from '@/lib/github/fetch';

export async function GET(request: NextRequest) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const owner = request.nextUrl.searchParams.get('owner');
  const repo = request.nextUrl.searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 });
  }

  try {
    const api = getGithubApi(session.user.id);
    const bundle = await fetchGithubRepoBundle(api, owner, repo);
    return NextResponse.json(bundle);
  } catch (error) {
    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
