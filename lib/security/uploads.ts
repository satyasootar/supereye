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
  '.hta',
  '.dll',
  '.sys',
  '.reg',
]);

const BLOCKED_ATTACHMENT_MIME_TYPES = new Set([
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-sh',
  'application/javascript',
  'text/javascript',
  'application/x-javascript',
  'application/vnd.microsoft.portable-executable',
  'application/x-bat',
  'application/hta',
  'application/x-dosexec',
  'application/java-archive',
]);

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/flac',
  'audio/x-flac',
  'video/webm',
]);

function normalizeMime(type: string | undefined): string {
  return (type ?? '').toLowerCase().split(';')[0].trim();
}

function getExtension(filename: string): string {
  if (!filename.includes('.')) return '';
  return `.${filename.split('.').pop()?.toLowerCase() ?? ''}`;
}

function hasBlockedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  if (lower.includes('\0')) return true;

  const ext = getExtension(lower);
  if (BLOCKED_ATTACHMENT_EXTENSIONS.has(ext)) return true;

  // Catch double-extension tricks like report.pdf.exe
  const parts = lower.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const innerExt = `.${parts[i]}`;
    if (BLOCKED_ATTACHMENT_EXTENSIONS.has(innerExt)) return true;
  }

  return false;
}

export function validateAttachmentFiles(files: File[]): string | null {
  if (files.length > MAX_ATTACHMENTS) {
    return `Maximum ${MAX_ATTACHMENTS} attachments allowed`;
  }

  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return `Attachment "${file.name}" exceeds ${MAX_ATTACHMENT_BYTES / (1024 * 1024)}MB limit`;
    }

    if (hasBlockedExtension(file.name)) {
      const ext = getExtension(file.name) || 'unknown';
      return `Attachment type "${ext}" is not allowed`;
    }

    const mime = normalizeMime(file.type);
    if (mime && BLOCKED_ATTACHMENT_MIME_TYPES.has(mime)) {
      return `Attachment MIME type "${mime}" is not allowed`;
    }
  }

  return null;
}

export function validateAudioFile(file: Blob): string | null {
  if (file.size > MAX_AUDIO_BYTES) {
    return `Audio file exceeds ${MAX_AUDIO_BYTES / (1024 * 1024)}MB limit`;
  }

  const mime = normalizeMime(file.type);
  if (!mime) {
    return 'Audio file type could not be determined';
  }

  if (!ALLOWED_AUDIO_MIME_TYPES.has(mime)) {
    return `Audio type "${mime}" is not allowed`;
  }

  return null;
}
