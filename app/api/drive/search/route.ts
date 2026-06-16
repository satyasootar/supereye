import { NextRequest, NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { getDriveApi } from '@/lib/drive/client';
import { searchDrive } from '@/lib/drive/fetch';

export async function GET(req: NextRequest) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) {
    return NextResponse.json({ items: [] });
  }

  try {
    const api = getDriveApi(session.user.id);
    const items = await searchDrive(api, q);
    return NextResponse.json({ items });
  } catch (error) {
    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
