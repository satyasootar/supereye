import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { getDriveApi } from '@/lib/drive/client';
import { fetchDriveRecent } from '@/lib/drive/fetch';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const api = getDriveApi(session.user.id);
    const overview = await fetchDriveRecent(api);
    return NextResponse.json(overview);
  } catch (error) {
    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
