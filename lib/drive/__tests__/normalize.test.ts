import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DRIVE_FOLDER_MIME } from '../types.ts';
import { normalizeDriveItem, normalizeDriveList } from '../normalize.ts';

describe('normalizeDriveItem', () => {
  it('normalizes file metadata', () => {
    const item = normalizeDriveItem({
      id: 'file-1',
      name: 'Notes.txt',
      mimeType: 'text/plain',
      modifiedTime: '2026-03-01T12:00:00.000Z',
      webViewLink: 'https://drive.google.com/file/1',
      size: '128',
      fileExtension: 'txt',
      parents: ['root'],
    });

    assert.ok(item);
    assert.equal(item?.name, 'Notes.txt');
    assert.equal(item?.isFolder, false);
    assert.equal(item?.size, 128);
    assert.equal(item?.parents[0], 'root');
  });

  it('marks Google folder mime type as folder', () => {
    const item = normalizeDriveItem({
      id: 'folder-1',
      name: 'Projects',
      mimeType: DRIVE_FOLDER_MIME,
    });

    assert.ok(item);
    assert.equal(item?.isFolder, true);
  });

  it('returns null when id or name is missing', () => {
    assert.equal(normalizeDriveItem({ name: 'orphan' }), null);
    assert.equal(normalizeDriveItem({ id: 'x' }), null);
  });
});

describe('normalizeDriveList', () => {
  it('unwraps files array from API payload', () => {
    const items = normalizeDriveList({
      files: [
        { id: 'a', name: 'A.txt', mimeType: 'text/plain' },
        { id: 'b', name: 'B', mimeType: DRIVE_FOLDER_MIME },
      ],
    });

    assert.equal(items.length, 2);
    assert.equal(items[0]?.name, 'A.txt');
    assert.equal(items[1]?.isFolder, true);
  });

  it('accepts raw array payloads', () => {
    const items = normalizeDriveList([
      { id: 'c', name: 'C.pdf', mimeType: 'application/pdf' },
    ]);
    assert.equal(items.length, 1);
    assert.equal(items[0]?.name, 'C.pdf');
  });

  it('filters invalid entries', () => {
    const items = normalizeDriveList({
      files: [{ id: 'ok', name: 'ok.txt' }, { id: 'bad' }],
    });
    assert.equal(items.length, 1);
  });
});
