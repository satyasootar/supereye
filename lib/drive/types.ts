export const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';

export type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  modifiedTime: string | null;
  webViewLink: string | null;
  iconLink: string | null;
  size: number | null;
  fileExtension: string | null;
  parents: string[];
};

export type DriveBrowseResult = {
  folderId: string;
  items: DriveItem[];
  nextPageToken: string | null;
};

export type DriveRecentOverview = {
  recent: DriveItem[];
  starred: DriveItem[];
  stats: {
    recentCount: number;
    starredCount: number;
  };
};

export type DriveSection = 'recent' | 'browse';
