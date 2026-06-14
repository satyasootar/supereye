'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type AgentAction } from '@/lib/store/app-store';
import { AgentAvatar } from './agent-avatar';
import { AnalyzingCard } from './actions/analyzing-card';
import { EmailDraftCard } from './actions/email-draft-card';
import { EmailSendCard } from './actions/email-send-card';
import { CalendarScheduleCard } from './actions/calendar-schedule-card';
import { GenericToolCard } from './actions/generic-tool-card';

function ActionCard({ action, readyDraftGroups }: { action: AgentAction; readyDraftGroups: Set<string> }) {
  switch (action.type) {
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
    default:
      return <GenericToolCard action={action} />;
  }
}

export function ActionStream() {
  const { agentActions, isAgentExecuting } = useAppStore();
  const [readyDraftGroups, setReadyDraftGroups] = useState<Set<string>>(new Set());

  const onDraftComplete = useCallback((groupId: string) => {
    setReadyDraftGroups((prev) => new Set(prev).add(groupId));
  }, []);

  const visibleActions = agentActions.filter(
    (action) => !(action.type === 'analyzing' && action.status === 'done')
  );

  if (visibleActions.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {visibleActions.map((action) => (
        <motion.div
          key={action.id}
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <AgentAvatar
            size={28}
            working={action.status === 'running' && isAgentExecuting}
            className="mt-1"
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
