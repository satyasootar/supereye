'use client';

import { motion } from 'framer-motion';
import type { AgentAction } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { AgentServiceIcon } from '../agent-service-icon';
import { GitBranch, Check } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 380, damping: 26 };

function StatusBadge({ status }: { status: 'open' | 'closed' | 'merged' }) {
  const config = {
    open: { bg: 'bg-accent-blue/15', text: 'text-accent-blue', label: 'Open' },
    closed: { bg: 'bg-destructive/15', text: 'text-destructive', label: 'Closed' },
    merged: { bg: 'bg-[var(--priority-ai)]/15', text: 'text-[var(--priority-ai)]', label: 'Merged' },
  }[status];

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ ...spring, delay: 0.15 }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        config.bg,
        config.text
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </motion.span>
  );
}

function IssueStatusDot({ status }: { status: 'open' | 'closed' }) {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ ...spring, delay: 0.15 }}
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full',
        status === 'open' ? 'bg-success' : 'bg-destructive'
      )}
    />
  );
}

export function GitHubActionCard({ action }: { action: AgentAction }) {
  const p = action.payload;
  const isRunning = action.status === 'running';
  const isDone = action.status === 'done';

  // Determine the kind of GitHub action
  const isPR = !!p?.prTitle || !!p?.prNumber;
  const isIssue = !!p?.issueTitle || !!p?.issueNumber;
  const isCommit = !!p?.commitMessage;

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
        <AgentServiceIcon service="github" size={14} />
        {p?.repoName ? (
          <span className="font-mono text-[12px] text-text-muted">
            <span className="opacity-50">{p.repoName.split('/')[0]}/</span>
            <span className="text-text-secondary">{p.repoName.split('/')[1]}</span>
          </span>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            GitHub
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

      {/* PR Card */}
      {isPR && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
          className="space-y-1.5"
        >
          <div className="flex items-start gap-2">
            <p className="text-[13px] font-medium text-text-primary leading-snug">
              {p?.prTitle || action.title}
              {p?.prNumber && (
                <span className="ml-1.5 text-[11px] font-mono text-text-muted">#{p.prNumber}</span>
              )}
            </p>
          </div>
          {p?.prStatus && <StatusBadge status={p.prStatus} />}
          {p?.branch && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted"
            >
              <GitBranch className="h-3 w-3" />
              {p.branch}
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Issue Card */}
      {isIssue && !isPR && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
          className="flex items-start gap-2"
        >
          {p?.issueStatus && <IssueStatusDot status={p.issueStatus} />}
          <div>
            <p className="text-[13px] font-medium text-text-primary leading-snug">
              {p?.issueTitle || action.title}
              {p?.issueNumber && (
                <span className="ml-1.5 text-[11px] font-mono text-text-muted">#{p.issueNumber}</span>
              )}
            </p>
          </div>
        </motion.div>
      )}

      {/* Commit Card */}
      {isCommit && !isPR && !isIssue && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
          className="space-y-1"
        >
          <p className="text-[13px] text-text-primary font-mono leading-snug line-clamp-2">
            {p?.commitMessage}
          </p>
        </motion.div>
      )}

      {/* Generic / Fallback */}
      {!isPR && !isIssue && !isCommit && (
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
          <Check className="h-3.5 w-3.5" />
          Done
        </motion.div>
      )}
    </motion.div>
  );
}
