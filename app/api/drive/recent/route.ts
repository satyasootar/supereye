import { NextResponse } from 'next/server';
import { requireActiveUserSession } from '@/lib/security/api-auth';
import { handleCorsairError } from '@/lib/corsair-error';
import { triggerBackgroundSyncIfStale } from '@/lib/cache/background-sync';
import { CACHE_KEYS } from '@/lib/cache/cache-keys';
import { getIntegrationCache, isCacheFresh } from '@/lib/cache/integration-cache';
import { SYNC_STALE_MS } from '@/lib/cache/sync-policy';
import { getDriveApi } from '@/lib/drive/client';
import { fetchDriveRecent } from '@/lib/drive/fetch';
import { syncDriveForUser } from '@/lib/drive/sync';
import type { DriveRecentOverview } from '@/lib/drive/types';

export async function GET() {
  const authResult = await requireActiveUserSession();
  if ('error' in authResult) return authResult.error;
  const { session } = authResult;
  const userId = session.user.id;

  triggerBackgroundSyncIfStale(userId, 'googledrive', () => syncDriveForUser(userId));

  try {
    const cached = await getIntegrationCache<DriveRecentOverview>(
      userId,
      CACHE_KEYS.driveRecent
    );

    if (cached && isCacheFresh(cached.updatedAt, SYNC_STALE_MS.googledrive)) {
      return NextResponse.json(cached.payload);
    }

    if (cached) {
      return NextResponse.json(cached.payload);
    }

    await syncDriveForUser(userId);
    const fresh = await getIntegrationCache<DriveRecentOverview>(
      userId,
      CACHE_KEYS.driveRecent
    );
    if (fresh) {
      return NextResponse.json(fresh.payload);
    }

    const api = getDriveApi(userId);
    const overview = await fetchDriveRecent(api);
    return NextResponse.json(overview);
  } catch (error) {
    const stale = await getIntegrationCache<DriveRecentOverview>(
      userId,
      CACHE_KEYS.driveRecent
    );
    if (stale) return NextResponse.json(stale.payload);

    const handled = handleCorsairError(error);
    return NextResponse.json({ error: handled.error, code: handled.code }, { status: handled.status });
  }
}
