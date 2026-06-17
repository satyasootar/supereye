'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type AgentAction } from '@/lib/store/app-store';
import { AgentAvatar } from './agent-avatar';
import { AnalyzingCard } from './actions/analyzing-card';
import { EmailDraftCard } from './actions/email-draft-card';
import { EmailSendCard } from './actions/email-send-card';
import { CalendarScheduleCard } from './actions/calendar-schedule-card';
import { GitHubActionCard } from './actions/github-action-card';
import { DriveActionCard } from './actions/drive-action-card';
import { GenericToolCard } from './actions/generic-tool-card';

/**
 * Smart routing: for `generic` actions, detect if the toolName
 * indicates a GitHub or Drive operation and route to the specialized card.
 */
function resolveActionType(action: AgentAction): AgentAction['type'] {
  if (action.type !== 'generic') return action.type;
  const tool = action.payload?.toolName?.toLowerCase() ?? '';
  if (tool.includes('github') || tool.includes('git_')) return 'github_action';
  if (tool.includes('drive') || tool.includes('google_drive')) return 'drive_action';
  return 'generic';
}

function ActionCard({ action, readyDraftGroups }: { action: AgentAction; readyDraftGroups: Set<string> }) {
  const resolved = resolveActionType(action);
  switch (resolved) {
    case 'analyzing':
      return <AnalyzingCard action={action} />;
    case 'email_draft':
      return <EmailDraftCard action={action} />;
    case 'email_send':
      return (
        <EmailSendCard
          action={action}
          canReveal={!action.groupId || readyDraftGroups.has(action.groupId)}
        />
      );
    case 'calendar_schedule':
      return <CalendarScheduleCard action={action} />;
    case 'github_action':
      return <GitHubActionCard action={action} />;
    case 'drive_action':
      return <DriveActionCard action={action} />;
    default:
      return <GenericToolCard action={action} />;
  }
}

export function ActionStream() {
  const { agentActions, isAgentExecuting, agentPendingReview } = useAppStore();
  const [readyDraftGroups, setReadyDraftGroups] = useState<Set<string>>(new Set());

  const onDraftComplete = useCallback((groupId: string) => {
    setReadyDraftGroups((prev) => new Set(prev).add(groupId));
  }, []);

  const visibleActions = agentActions.filter((action) => {
    if (action.type === 'analyzing' && action.status === 'done') return false;
    if (agentPendingReview && action.payload?.phase === 'awaiting_review') return false;
    return true;
  });

  if (visibleActions.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {visibleActions.map((action, index) => (
        <motion.div
          key={`${action.id}-${action.groupId ?? action.type}-${index}`}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 220,
            damping: 26,
            delay: index * 0.1,
          }}
          className="flex gap-3"
        >
          <AgentAvatar
            size={28}
            working={action.status === 'running' && isAgentExecuting}
            className="mt-0.5"
          />
          <div className="min-w-0 flex-1">
            {action.type === 'email_draft' ? (
              <EmailDraftCard action={action} onDraftComplete={onDraftComplete} />
            ) : (
              <ActionCard action={action} readyDraftGroups={readyDraftGroups} />
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
