export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 10;
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const BLOCKED_ATTACHMENT_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.com',
  '.msi',
  '.scr',
  '.ps1',
  '.vbs',
  '.js',
  '.jar',
  '.sh',
]);

export function validateAttachmentFiles(files: File[]): string | null {
  if (files.length > MAX_ATTACHMENTS) {
    return `Maximum ${MAX_ATTACHMENTS} attachments allowed`;
  }

  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return `Attachment "${file.name}" exceeds ${MAX_ATTACHMENT_BYTES / (1024 * 1024)}MB limit`;
    }

    const ext = file.name.includes('.')
      ? `.${file.name.split('.').pop()?.toLowerCase()}`
      : '';
    if (BLOCKED_ATTACHMENT_EXTENSIONS.has(ext)) {
      return `Attachment type "${ext}" is not allowed`;
    }
  }

  return null;
}

export function validateAudioFile(file: Blob): string | null {
  if (file.size > MAX_AUDIO_BYTES) {
    return `Audio file exceeds ${MAX_AUDIO_BYTES / (1024 * 1024)}MB limit`;
  }
  return null;
}
