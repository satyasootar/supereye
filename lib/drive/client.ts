import { getTenant } from '@/lib/corsair';

export type DriveApi = {
  files: {
    list: (input?: Record<string, unknown>) => Promise<unknown>;
    get: (input: Record<string, unknown>) => Promise<unknown>;
  };
  search: {
    filesAndFolders: (input: Record<string, unknown>) => Promise<unknown>;
  };
};

export function getDriveApi(userId: string): DriveApi {
  const tenant = getTenant(userId) as { googledrive?: { api: DriveApi } };

  if (!tenant.googledrive?.api) {
    throw new Error('Google Drive is not connected for this account');
  }

  return tenant.googledrive.api;
}
