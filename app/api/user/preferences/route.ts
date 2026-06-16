import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { getUserPreferencesWithContext, upsertUserPreferences } from '@/lib/user/preferences';
import type { UserWorkspacePreferences } from '@/lib/plugins/types';
import { parseJsonBody } from '@/lib/validation/http';
import { preferencesPatchSchema } from '@/lib/validation/user';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const data = await getUserPreferencesWithContext(session.user.id);
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const parsed = await parseJsonBody(req, preferencesPatchSchema);
  if ('error' in parsed) return parsed.error;

  const data = await upsertUserPreferences(
    session.user.id,
    parsed.data as Partial<UserWorkspacePreferences>
  );
  return NextResponse.json(data);
}
