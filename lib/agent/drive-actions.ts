import { getDriveApi } from '@/lib/drive/client';
import { fetchDriveRecent, searchDrive } from '@/lib/drive/fetch';
import type { DriveItem } from '@/lib/drive/types';

export function summarizeDriveFile(item: DriveItem) {
  return {
    id: item.id,
    name: item.name,
    mimeType: item.mimeType,
    isFolder: item.isFolder,
    url: item.webViewLink,
    modifiedTime: item.modifiedTime,
    size: item.size,
  };
}

export function toDriveActionFilesFromSummary(
  files: Array<ReturnType<typeof summarizeDriveFile>>
) {
  return files.map((file) => ({
    name: file.name,
    type: file.mimeType,
    size: file.size ?? undefined,
    url: file.url ?? undefined,
  }));
}

/** List recently modified Drive files (same path as the Drive workspace panel). */
export async function listDriveRecentFilesForUser(
  userId: string,
  options?: { limit?: number; filesOnly?: boolean }
) {
  const api = getDriveApi(userId);
  const limit = options?.limit ?? 10;
  const filesOnly = options?.filesOnly ?? true;

  const overview = await fetchDriveRecent(api);
  let items = overview.recent;
  if (filesOnly) {
    items = items.filter((item) => !item.isFolder);
  }

  const slice = items.slice(0, limit);
  const mostRecent = slice[0] ?? null;

  return {
    success: true,
    count: slice.length,
    files: slice.map(summarizeDriveFile),
    mostRecent: mostRecent ? summarizeDriveFile(mostRecent) : null,
  };
}

export async function searchDriveFilesForUser(
  userId: string,
  options: { query: string; limit?: number }
) {
  const api = getDriveApi(userId);
  const limit = options.limit ?? 15;
  const query = options.query.trim();
  if (!query) {
    throw new Error('Search query is required');
  }

  const items = await searchDrive(api, query, limit);
  const files = items.filter((item) => !item.isFolder);

  return {
    success: true,
    query,
    count: files.length,
    files: files.map(summarizeDriveFile),
    mostRecent: files[0] ? summarizeDriveFile(files[0]) : null,
  };
}
