import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { searchWorkspace } from '@/lib/search/workspace-search';
import { parseQuery } from '@/lib/validation/http';
import { z } from 'zod';

const workspaceSearchSchema = z.object({
  q: z.string().trim().min(2, 'Query must be at least 2 characters').max(200),
});

export async function GET(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;

  const parsed = parseQuery(req.url, workspaceSearchSchema);
  if ('error' in parsed) return parsed.error;

  const started = Date.now();
  const { results, mode } = await searchWorkspace(
    authResult.session.user.id,
    parsed.data.q
  );

  return NextResponse.json({
    results,
    meta: {
      query: parsed.data.q,
      tookMs: Date.now() - started,
      mode,
    },
  });
}
