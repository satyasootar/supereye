'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  History,
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

export function ThreadHistoryPopover() {
  const [open, setOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const { isAgentExecuting } = useAppStore();
  const {
    threads,
    isLoadingThreads,
    agentThreadId,
    loadThread,
    startNewChat,
    renameThread,
    deleteThread,
    isDeleting,
  } = useAgentThreads();

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuOpenId]);

  const handleRename = async (threadId: string) => {
    const title = renameValue.trim();
    if (!title) {
      setRenamingId(null);
      return;
    }
    await renameThread({ threadId, title });
    setRenamingId(null);
    setMenuOpenId(null);
  };

  const handleDelete = async (threadId: string) => {
    if (!confirm('Delete this chat? This cannot be undone.')) return;
    await deleteThread(threadId);
    setMenuOpenId(null);
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
            'disabled:opacity-40'
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
        className="z-[220] w-[300px] p-0 border-border-default bg-bg-elevated/95 backdrop-blur-xl shadow-xl overflow-hidden rounded-xl"
      >
        <div className="flex flex-col max-h-[min(420px,var(--radix-popover-content-available-height,420px))]">
          <div className="flex items-center justify-between gap-2 border-b border-border-default px-3 py-3 shrink-0">
            <h3 className="text-sm font-semibold text-text-primary px-1">Chat History</h3>
            <button
              type="button"
              onClick={() => {
                startNewChat();
                setOpen(false);
              }}
              disabled={isAgentExecuting}
              className="flex items-center gap-1.5 rounded-md bg-bg-surface hover:bg-bg-highlight px-2 py-1 text-[12px] font-medium text-text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
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

                  return (
                    <li key={thread.id} className="group relative">
                      {isRenaming ? (
                        <form
                          className="px-1"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleRename(thread.id);
                          }}
                        >
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRename(thread.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setRenamingId(null);
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
                            'flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
                            isActive
                              ? 'bg-bg-highlight text-text-primary'
                              : 'text-text-muted hover:bg-bg-surface/60 hover:text-text-primary',
                            isAgentExecuting && 'cursor-not-allowed opacity-60'
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium leading-snug">
                              {thread.title}
                            </p>
                            {thread.preview && (
                              <p className="mt-0.5 truncate text-[11px] text-text-muted">
                                {thread.preview}
                              </p>
                            )}
                            <p className="mt-1 text-[10px] text-text-muted/80">
                              {formatRelativeTime(thread.lastMessageAt)}
                            </p>
                          </div>
                        </button>
                      )}

                      {!isRenaming && (
                        <div className="absolute right-1 top-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === thread.id ? null : thread.id);
                            }}
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-md text-text-muted opacity-0 transition-all hover:bg-bg-elevated hover:text-text-primary group-hover:opacity-100',
                              menuOpenId === thread.id && 'opacity-100'
                            )}
                            aria-label="Thread options"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>

                          {menuOpenId === thread.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute right-0 top-7 z-20 min-w-[120px] rounded-lg border border-border-default bg-bg-elevated py-1 shadow-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setRenamingId(thread.id);
                                  setRenameValue(thread.title);
                                  setMenuOpenId(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-text-primary hover:bg-bg-surface"
                              >
                                <Pencil className="h-3 w-3" />
                                Rename
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDelete(thread.id)}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-red-500 hover:bg-bg-surface disabled:opacity-50"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
