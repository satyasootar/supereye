import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { getGithubApi } from '@/lib/github/client';
import { normalizeRepo } from '@/lib/github/normalize';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const api = getGithubApi(session.user.id);
    const result = await api.repositories.list({
      perPage: 50,
      sort: 'updated',
      direction: 'desc',
    });

    const repos = Array.isArray(result)
      ? result.map((item) => normalizeRepo(item as Record<string, unknown>))
      : [];

    return NextResponse.json({ repos });
  } catch (error) {
    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
