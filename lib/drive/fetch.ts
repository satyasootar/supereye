import type { DriveApi } from './client';
import { normalizeDriveItem, normalizeDriveList } from './normalize';
import type { DriveBrowseResult, DriveItem, DriveRecentOverview } from './types';

const LIST_FIELDS =
  'files(id,name,mimeType,modifiedTime,webViewLink,iconLink,size,fileExtension,parents),nextPageToken';

function folderQuery(folderId: string) {
  const parent = folderId === 'root' ? "'root'" : `'${folderId}'`;
  return `${parent} in parents and trashed = false`;
}

export async function listDriveFolder(
  api: DriveApi,
  folderId = 'root',
  pageSize = 50
): Promise<DriveBrowseResult> {
  const result = await api.files.list({
    q: folderQuery(folderId),
    pageSize,
    orderBy: 'folder,name',
    fields: LIST_FIELDS,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const payload = result as { files?: unknown[]; nextPageToken?: string };

  return {
    folderId,
    items: normalizeDriveList(payload),
    nextPageToken: payload.nextPageToken ?? null,
  };
}

export async function searchDrive(
  api: DriveApi,
  query: string,
  pageSize = 30
): Promise<DriveItem[]> {
  const escaped = query.replace(/'/g, "\\'");
  const result = await api.search.filesAndFolders({
    q: `name contains '${escaped}' and trashed = false`,
    pageSize,
    orderBy: 'modifiedTime desc',
    fields: LIST_FIELDS,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return normalizeDriveList(result);
}

export async function fetchDriveRecent(api: DriveApi): Promise<DriveRecentOverview> {
  const [recentResult, starredResult] = await Promise.all([
    api.files.list({
      q: 'trashed = false',
      pageSize: 20,
      orderBy: 'modifiedTime desc',
      fields: LIST_FIELDS,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    }),
    api.files.list({
      q: 'starred = true and trashed = false',
      pageSize: 12,
      orderBy: 'modifiedTime desc',
      fields: LIST_FIELDS,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    }),
  ]);

  const recent = normalizeDriveList(recentResult);
  const starred = normalizeDriveList(starredResult);

  return {
    recent,
    starred,
    stats: {
      recentCount: recent.length,
      starredCount: starred.length,
    },
  };
}

export async function getDriveFile(api: DriveApi, fileId: string): Promise<DriveItem | null> {
  const result = await api.files.get({
    fileId,
    supportsAllDrives: true,
    fields:
      'id,name,mimeType,modifiedTime,webViewLink,iconLink,size,fileExtension,parents',
  });

  if (!result || typeof result !== 'object') return null;
  return normalizeDriveItem(result as Record<string, unknown>);
}
