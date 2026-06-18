import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAttachmentFiles,
  validateAudioFile,
  MAX_ATTACHMENT_BYTES,
  MAX_AUDIO_BYTES,
} from '../uploads.ts';

describe('security uploads', () => {
  it('rejects too many attachments', () => {
    const files = Array.from({ length: 11 }, (_, i) => ({
      name: `file${i}.txt`,
      size: 100,
    })) as File[];
    const error = validateAttachmentFiles(files);
    assert.match(error ?? '', /Maximum/);
  });

  it('rejects oversized attachment', () => {
    const files = [
      { name: 'big.bin', size: MAX_ATTACHMENT_BYTES + 1 },
    ] as File[];
    const error = validateAttachmentFiles(files);
    assert.match(error ?? '', /exceeds/);
  });

  it('rejects dangerous extensions', () => {
    const files = [{ name: 'malware.exe', size: 100 }] as File[];
    const error = validateAttachmentFiles(files);
    assert.match(error ?? '', /not allowed/);
  });

  it('rejects double-extension tricks', () => {
    const files = [{ name: 'invoice.pdf.exe', size: 100 }] as File[];
    const error = validateAttachmentFiles(files);
    assert.match(error ?? '', /not allowed/);
  });

  it('rejects dangerous MIME types even with safe extension', () => {
    const files = [
      { name: 'notes.txt', size: 100, type: 'application/javascript' },
    ] as File[];
    const error = validateAttachmentFiles(files);
    assert.match(error ?? '', /MIME type/);
  });

  it('accepts valid attachments', () => {
    const files = [{ name: 'doc.pdf', size: 1024, type: 'application/pdf' }] as File[];
    assert.equal(validateAttachmentFiles(files), null);
  });

  it('validates audio size', () => {
    const blob = { size: MAX_AUDIO_BYTES + 1, type: 'audio/webm' } as Blob;
    assert.match(validateAudioFile(blob) ?? '', /exceeds/);
  });

  it('rejects audio without MIME type', () => {
    const blob = { size: 1024 } as Blob;
    assert.match(validateAudioFile(blob) ?? '', /could not be determined/);
  });

  it('rejects disallowed audio MIME types', () => {
    const blob = { size: 1024, type: 'application/octet-stream' } as Blob;
    assert.match(validateAudioFile(blob) ?? '', /not allowed/);
  });

  it('accepts valid audio', () => {
    const blob = { size: 1024, type: 'audio/webm' } as Blob;
    assert.equal(validateAudioFile(blob), null);
  });
});
