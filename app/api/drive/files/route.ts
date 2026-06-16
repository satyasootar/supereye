import { NextRequest, NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { triggerBackgroundSyncIfStale } from '@/lib/cache/background-sync';
import { CACHE_KEYS } from '@/lib/cache/cache-keys';
import { getIntegrationCache, isCacheFresh, setIntegrationCache } from '@/lib/cache/integration-cache';
import { SYNC_STALE_MS } from '@/lib/cache/sync-policy';
import { getDriveApi } from '@/lib/drive/client';
import { listDriveFolder } from '@/lib/drive/fetch';
import { syncDriveForUser } from '@/lib/drive/sync';
import type { DriveBrowseResult } from '@/lib/drive/types';

export async function GET(req: NextRequest) {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;
  const userId = session.user.id;

  const folderId = req.nextUrl.searchParams.get('folderId') ?? 'root';
  const cacheKey = CACHE_KEYS.driveFolder(folderId);

  triggerBackgroundSyncIfStale(userId, 'googledrive', () => syncDriveForUser(userId));

  try {
    const cached = await getIntegrationCache<DriveBrowseResult>(userId, cacheKey);
    if (cached && isCacheFresh(cached.updatedAt, SYNC_STALE_MS.googledrive)) {
      return NextResponse.json(cached.payload);
    }

    const api = getDriveApi(userId);
    const result = await listDriveFolder(api, folderId);
    await setIntegrationCache(userId, cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    const stale = await getIntegrationCache<DriveBrowseResult>(userId, cacheKey);
    if (stale) return NextResponse.json(stale.payload);

    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
