import { DRIVE_FOLDER_MIME, type DriveItem } from './types';

function parseDate(raw: unknown): string | null {
  if (!raw) return null;
  const d = new Date(String(raw));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function normalizeDriveItem(raw: Record<string, unknown>): DriveItem | null {
  const id = raw.id ? String(raw.id) : '';
  const name = raw.name ? String(raw.name) : '';
  if (!id || !name) return null;

  const mimeType = raw.mimeType ? String(raw.mimeType) : 'application/octet-stream';

  return {
    id,
    name,
    mimeType,
    isFolder: mimeType === DRIVE_FOLDER_MIME,
    modifiedTime: parseDate(raw.modifiedTime),
    webViewLink: raw.webViewLink ? String(raw.webViewLink) : null,
    iconLink: raw.iconLink ? String(raw.iconLink) : null,
    size: raw.size != null ? Number(raw.size) : null,
    fileExtension: raw.fileExtension != null ? String(raw.fileExtension) : null,
    parents: Array.isArray(raw.parents) ? raw.parents.map(String) : [],
  };
}

export function normalizeDriveList(result: unknown): DriveItem[] {
  const files =
    result && typeof result === 'object' && 'files' in result
      ? (result as { files?: unknown[] }).files
      : Array.isArray(result)
        ? result
        : [];

  if (!Array.isArray(files)) return [];

  return files
    .map((item) => normalizeDriveItem(item as Record<string, unknown>))
    .filter((item): item is DriveItem => item != null);
}
