import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchDriveRecent,
  getDriveFile,
  listDriveFolder,
  searchDrive,
} from '../fetch.ts';
import type { DriveApi } from '../client.ts';

function makeApi(overrides: Partial<DriveApi> = {}): DriveApi {
  return {
    files: {
      list: async () => ({ files: [] }),
      get: async () => null,
      ...overrides.files,
    },
    search: {
      filesAndFolders: async () => ({ files: [] }),
      ...overrides.search,
    },
  };
}

describe('listDriveFolder', () => {
  it('queries children of a folder and normalizes items', async () => {
    const api = makeApi({
      files: {
        list: async (input) => {
          assert.match(String(input.q), /'folder-1' in parents/);
          return {
            files: [
              {
                id: 'child-1',
                name: 'Roadmap',
                mimeType: 'application/vnd.google-apps.folder',
              },
            ],
            nextPageToken: 'next',
          };
        },
        get: async () => null,
      },
    });

    const result = await listDriveFolder(api, 'folder-1', 25);
    assert.equal(result.folderId, 'folder-1');
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]?.isFolder, true);
    assert.equal(result.nextPageToken, 'next');
  });

  it('uses root parent query for root folder', async () => {
    let query = '';
    const api = makeApi({
      files: {
        list: async (input) => {
          query = String(input.q);
          return { files: [] };
        },
        get: async () => null,
      },
    });

    await listDriveFolder(api, 'root');
    assert.match(query, /'root' in parents/);
  });
});

describe('searchDrive', () => {
  it('escapes single quotes in search terms', async () => {
    let query = '';
    const api = makeApi({
      search: {
        filesAndFolders: async (input) => {
          query = String(input.q);
          return {
            files: [{ id: '1', name: "O'Reilly.pdf", mimeType: 'application/pdf' }],
          };
        },
      },
    });

    const items = await searchDrive(api, "O'Reilly");
    assert.match(query, /O\\'Reilly/);
    assert.equal(items.length, 1);
    assert.equal(items[0]?.name, "O'Reilly.pdf");
  });
});

describe('fetchDriveRecent', () => {
  it('returns recent and starred lists with stats', async () => {
    const api = makeApi({
      files: {
        list: async (input) => {
          const q = String(input.q);
          if (q.includes('starred')) {
            return {
              files: [{ id: 's1', name: 'Starred.doc', mimeType: 'application/msword' }],
            };
          }
          return {
            files: [
              { id: 'r1', name: 'Recent.pdf', mimeType: 'application/pdf' },
              { id: 'r2', name: 'Recent2.pdf', mimeType: 'application/pdf' },
            ],
          };
        },
        get: async () => null,
      },
    });

    const overview = await fetchDriveRecent(api);
    assert.equal(overview.recent.length, 2);
    assert.equal(overview.starred.length, 1);
    assert.equal(overview.stats.recentCount, 2);
    assert.equal(overview.stats.starredCount, 1);
  });
});

describe('getDriveFile', () => {
  it('returns normalized file when found', async () => {
    const api = makeApi({
      files: {
        list: async () => ({ files: [] }),
        get: async (input) => {
          assert.equal(input.fileId, 'abc');
          return { id: 'abc', name: 'Sheet', mimeType: 'application/vnd.google-apps.spreadsheet' };
        },
      },
    });

    const file = await getDriveFile(api, 'abc');
    assert.ok(file);
    assert.equal(file?.name, 'Sheet');
    assert.equal(file?.isFolder, false);
  });

  it('returns null for empty API response', async () => {
    const api = makeApi({
      files: {
        list: async () => ({ files: [] }),
        get: async () => null,
      },
    });

    assert.equal(await getDriveFile(api, 'missing'), null);
  });
});
