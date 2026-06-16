import { NextRequest, NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { getDriveApi } from '@/lib/drive/client';
import { listDriveFolder } from '@/lib/drive/fetch';

export async function GET(req: NextRequest) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;

  const folderId = req.nextUrl.searchParams.get('folderId') ?? 'root';

  try {
    const api = getDriveApi(session.user.id);
    const result = await listDriveFolder(api, folderId);
    return NextResponse.json(result);
  } catch (error) {
    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
