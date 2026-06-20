'use client';

import { useState } from 'react';
import {
  MessageSquarePlus,
  Pencil,
  Trash2,
  Loader2,
  History,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentThreads } from '@/hooks/use-agent-threads';
import { useAppStore } from '@/lib/store/app-store';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function stripPreviewMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function ThreadActionsMenu({
  disabled,
  isDeleting,
  onRename,
  onDelete,
}: {
  disabled: boolean;
  isDeleting: boolean;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors',
            'hover:bg-bg-surface hover:text-text-primary',
            'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40',
            'disabled:cursor-not-allowed disabled:opacity-30',
          )}
          aria-label="Chat options"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className="z-[300] w-36 gap-0 p-1"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen(false);
            onRename();
          }}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] font-medium text-text-primary transition-colors hover:bg-bg-highlight disabled:opacity-40"
        >
          <Pencil className="h-3.5 w-3.5 shrink-0" />
          Rename
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen(false);
            onDelete();
          }}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12px] font-medium text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0" />
          Delete
        </button>
      </PopoverContent>
    </Popover>
  );
}

export function ThreadHistoryPopover() {
  const [open, setOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { isAgentExecuting } = useAppStore();
  const {
    threads,
    isLoadingThreads,
    agentThreadId,
    loadThread,
    startNewChat,
    renameThread,
    deleteThread,
    deleteAllThreads,
    isDeleting,
  } = useAgentThreads();

  const handleRename = async (threadId: string) => {
    const title = renameValue.trim();
    if (!title) {
      setRenamingId(null);
      return;
    }
    await renameThread({ threadId, title });
    setRenamingId(null);
  };

  const handleDelete = async (threadId: string) => {
    if (!confirm('Delete this chat? This cannot be undone.')) return;
    setDeletingId(threadId);
    try {
      await deleteThread(threadId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (
      !confirm(
        'Delete all chat history? Every conversation will be permanently removed. This cannot be undone.',
      )
    ) {
      return;
    }
    await deleteAllThreads();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isAgentExecuting}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg border transition-all',
            'border-border-subtle bg-bg-surface text-text-muted',
            'hover:border-border-default hover:text-text-primary',
            'disabled:opacity-40',
          )}
          aria-label="Chat History"
        >
          <History className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={12}
        collisionPadding={24}
        className="z-[220] w-[300px] overflow-visible border-border-default bg-bg-elevated/95 p-0 shadow-xl backdrop-blur-xl"
      >
        <div className="flex max-h-[min(420px,var(--radix-popover-content-available-height,420px))] flex-col overflow-hidden rounded-xl">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-default px-3 py-3">
            <h3 className="px-1 text-sm font-semibold text-text-primary">Chat History</h3>
            <button
              type="button"
              onClick={() => {
                startNewChat();
                setOpen(false);
              }}
              disabled={isAgentExecuting}
              className="flex items-center gap-1.5 rounded-md bg-bg-surface px-2 py-1 text-[12px] font-medium text-text-primary transition-colors hover:bg-bg-highlight disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              New
            </button>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain px-2 py-2">
            {isLoadingThreads ? (
              <div className="flex items-center justify-center py-8 text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : threads.length === 0 ? (
              <p className="px-2 py-6 text-center text-[12px] text-text-muted">
                No chats yet. Start a new conversation.
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {threads.map((thread) => {
                  const isActive = agentThreadId === thread.id;
                  const isRenaming = renamingId === thread.id;
                  const isDeletingThis = deletingId === thread.id;
                  const preview = thread.preview
                    ? stripPreviewMarkdown(thread.preview)
                    : null;

                  return (
                    <li
                      key={thread.id}
                      className={cn(
                        'group flex items-start gap-0.5 rounded-lg',
                        isActive && 'bg-bg-highlight',
                      )}
                    >
                      {isRenaming ? (
                        <form
                          className="min-w-0 flex-1 px-1 py-1"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void handleRename(thread.id);
                          }}
                        >
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(event) => setRenameValue(event.target.value)}
                            onBlur={() => void handleRename(thread.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Escape') setRenamingId(null);
                            }}
                            className="w-full rounded-lg border border-accent-blue/50 bg-bg-surface px-2.5 py-2 text-[12px] text-text-primary outline-none"
                          />
                        </form>
                      ) : (
                        <button
                          type="button"
                          disabled={isAgentExecuting}
                          onClick={() => {
                            loadThread(thread.id);
                            setOpen(false);
                          }}
                          className={cn(
                            'min-w-0 flex-1 rounded-lg px-2.5 py-2 text-left transition-colors',
                            isActive
                              ? 'text-text-primary'
                              : 'text-text-muted hover:text-text-primary',
                            isAgentExecuting && 'cursor-not-allowed opacity-60',
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-[13px] font-medium leading-snug">
                              {thread.title}
                            </p>
                            <span className="shrink-0 pt-0.5 text-[10px] text-text-muted/80">
                              {formatRelativeTime(thread.lastMessageAt)}
                            </span>
                          </div>
                          {preview ? (
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-text-muted">
                              {preview}
                            </p>
                          ) : null}
                        </button>
                      )}

                      {!isRenaming ? (
                        <div className="shrink-0 pt-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                          <ThreadActionsMenu
                            disabled={isAgentExecuting || isDeleting}
                            isDeleting={isDeletingThis}
                            onRename={() => {
                              setRenamingId(thread.id);
                              setRenameValue(thread.title);
                            }}
                            onDelete={() => void handleDelete(thread.id)}
                          />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {threads.length > 0 ? (
            <div className="shrink-0 border-t border-border-default px-3 py-2">
              <button
                type="button"
                disabled={isAgentExecuting || isDeleting}
                onClick={() => void handleDeleteAll()}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-medium text-text-muted transition-colors hover:bg-bg-surface hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear all history
              </button>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
