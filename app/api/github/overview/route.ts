import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { getGithubApi } from '@/lib/github/client';
import { fetchGithubOverview } from '@/lib/github/fetch';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const api = getGithubApi(session.user.id);
    const overview = await fetchGithubOverview(api);
    return NextResponse.json(overview);
  } catch (error) {
    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
