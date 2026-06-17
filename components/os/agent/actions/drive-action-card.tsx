'use client';

import { motion } from 'framer-motion';
import type { AgentAction } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { AgentServiceIcon } from '../agent-service-icon';
import {
  FileText,
  Folder,
  Image,
  FileSpreadsheet,
  File,
  Check,
  Share2,
} from 'lucide-react';
import { agentLinkClassName } from '@/components/os/agent/agent-link-text';

const spring = { type: 'spring' as const, stiffness: 220, damping: 26 };

function fileIcon(type?: string) {
  if (!type) return File;
  const t = type.toLowerCase();
  if (t.includes('folder') || t === 'directory') return Folder;
  if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('svg')) return Image;
  if (t.includes('sheet') || t.includes('csv') || t.includes('xlsx')) return FileSpreadsheet;
  if (t.includes('doc') || t.includes('pdf') || t.includes('text')) return FileText;
  return File;
}

function ProgressBar({ progress, done }: { progress: number; done: boolean }) {
  return (
    <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-border-subtle">
      <motion.div
        className="h-full bg-accent-blue"
        initial={{ width: '0%' }}
        animate={{ width: done ? '100%' : `${Math.min(progress, 100)}%` }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      />
    </div>
  );
}

export function DriveActionCard({ action }: { action: AgentAction }) {
  const p = action.payload;
  const isRunning = action.status === 'running';
  const isDone = action.status === 'done';
  const driveAction = p?.driveAction;
  const files = p?.files;
  const hasFileList = files && files.length > 0;
  const isUploadOrCreate = driveAction === 'upload' || driveAction === 'create';
  const isShare = driveAction === 'share';
  const isBrowse = driveAction === 'browse';

  const headerLabel = isBrowse ? 'Browsing Drive' : 'Google Drive';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="space-y-2 rounded-xl border border-border-subtle bg-bg-elevated p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <AgentServiceIcon service="drive" size={14} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {headerLabel}
        </span>
        {p?.folderName && (
          <span className="text-[11px] text-text-muted">
            · {p.folderName}
          </span>
        )}
        {isRunning && (
          <motion.span
            className="text-text-muted text-[11px]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            ···
          </motion.span>
        )}
      </div>

      {/* File list — staggered reveal */}
      {hasFileList && (
        <div className="space-y-1 rounded-lg bg-bg-surface p-2">
          {files.map((file, i) => {
            const Icon = fileIcon(file.type);
            return (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: i * 0.05 }}
                className="flex items-center gap-2.5 py-1"
              >
                <Icon className="h-4 w-4 shrink-0 text-text-muted" />
                {file.url ? (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn('truncate text-[13px] font-medium', agentLinkClassName)}
                  >
                    {file.name}
                  </a>
                ) : (
                  <span className="truncate text-[13px] font-medium text-text-primary">
                    {file.name}
                  </span>
                )}
                {file.size && (
                  <span className="ml-auto shrink-0 text-[10px] text-text-muted">
                    {formatSize(file.size)}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Single file action (upload/create/share) */}
      {p?.fileName && !hasFileList && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
          className="flex items-center gap-2.5 rounded-lg bg-bg-surface p-2.5"
        >
          {(() => {
            const Icon = fileIcon(p.fileType);
            return <Icon className="h-4 w-4 shrink-0 text-text-muted" />;
          })()}
          {p.webViewLink ? (
            <a
              href={p.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className={cn('truncate text-[13px] font-medium', agentLinkClassName)}
            >
              {p.fileName}
            </a>
          ) : (
            <span className="truncate text-[13px] font-medium text-text-primary">
              {p.fileName}
            </span>
          )}
          {isShare && isDone && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...spring, delay: 0.15 }}
              className="ml-auto flex items-center gap-1 rounded-full bg-accent-blue/10 px-2 py-0.5 text-[10px] font-semibold text-accent-blue"
            >
              <Share2 className="h-2.5 w-2.5" />
              Shared
            </motion.span>
          )}
        </motion.div>
      )}

      {/* Progress bar for uploads/creates */}
      {isUploadOrCreate && isRunning && (
        <ProgressBar progress={p?.progress ?? 0} done={false} />
      )}

      {/* Generic fallback title */}
      {!hasFileList && !p?.fileName && (
        <p className={cn('text-[13px] font-medium text-text-primary', isRunning && 'agent-shimmer-text')}>
          {action.title}
        </p>
      )}

      {/* Done indicator */}
      {isDone && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...spring, delay: 0.1 }}
          className="flex items-center gap-1.5 text-[11px] font-medium text-accent-blue"
        >
          {isDone && (
            <Check className="h-3.5 w-3.5" />
          )}
          {isUploadOrCreate ? 'Uploaded' : isShare ? 'Shared' : isBrowse ? 'Ready' : 'Done'}
        </motion.div>
      )}
    </motion.div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
