'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentAction } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { AgentServiceIcon } from '../agent-service-icon';
import { Send } from 'lucide-react';
import { AgentLinkText } from '@/components/os/agent/agent-link-text';

const spring = { type: 'spring' as const, stiffness: 220, damping: 26 };

function useLiveTyping(text: string, active: boolean, speed = 32) {
  const [visible, setVisible] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(text);
      setDone(true);
      return;
    }
    setVisible('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setVisible(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, active, speed]);

  return { visible, done };
}

function BlinkCursor() {
  return (
    <motion.span
      className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-accent-blue"
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.7, repeat: Infinity }}
    />
  );
}

export function EmailDraftCard({
  action,
  onDraftComplete,
}: {
  action: AgentAction;
  onDraftComplete?: (groupId: string) => void;
}) {
  const to = action.payload?.to;
  const toLabel = Array.isArray(to) ? to.join(', ') : to ?? '';
  const subject = action.payload?.subject ?? '';
  const body = action.payload?.body ?? '';
  const isAwaitingReview = action.payload?.phase === 'awaiting_review';
  const isRunning = action.status === 'running' && !isAwaitingReview;
  const [showPreview, setShowPreview] = useState(false);

  const { visible: typedSubject, done: subjectDone } = useLiveTyping(
    subject,
    isRunning && !showPreview,
    42
  );
  const { visible: typedBody, done: bodyDone } = useLiveTyping(
    body,
    isRunning && subjectDone && !showPreview,
    28
  );

  const composingDone = subjectDone && bodyDone;

  useEffect(() => {
    if (bodyDone && action.groupId && !isAwaitingReview) {
      const timer = setTimeout(() => {
        setShowPreview(true);
        onDraftComplete?.(action.groupId!);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [bodyDone, action.groupId, onDraftComplete, isAwaitingReview]);

  useEffect(() => {
    if (action.status === 'done' && !isAwaitingReview) setShowPreview(true);
    if (isAwaitingReview) setShowPreview(true);
  }, [action.status, isAwaitingReview]);

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
        <AgentServiceIcon service="email" size={14} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {isAwaitingReview ? 'Review draft' : showPreview ? 'Email ready' : 'Composing email'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!showPreview ? (
          <motion.div
            key="composer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
            className="space-y-2"
          >
            {/* To field */}
            <div className="flex items-baseline gap-2 rounded-md bg-bg-surface px-2.5 py-1.5 text-[12px]">
              <span className="text-text-muted font-mono">To</span>
              <span className="text-text-primary font-medium">{toLabel || '···'}</span>
            </div>

            {/* Subject field */}
            <div className="flex items-baseline gap-2 rounded-md bg-bg-surface px-2.5 py-1.5 text-[12px]">
              <span className="text-text-muted font-mono">Subject</span>
              <span className="text-text-primary font-medium">
                {typedSubject}
                {isRunning && !subjectDone && <BlinkCursor />}
              </span>
            </div>

            {/* Divider */}
            <div className="border-b border-border-subtle/30" />

            {/* Body */}
            <div className="min-h-[64px] whitespace-pre-wrap rounded-md bg-bg-surface px-2.5 py-2 pt-1 text-[13px] leading-relaxed text-text-primary">
              {typedBody}
              {isRunning && subjectDone && !bodyDone && <BlinkCursor />}
            </div>

            {/* Send button — illuminates when writing completes */}
            <motion.div
              className="flex justify-end pt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors',
                  composingDone && !isRunning
                    ? 'bg-accent-blue text-text-inverse'
                    : composingDone
                      ? 'bg-accent-blue text-text-inverse'
                      : 'bg-bg-surface text-text-muted'
                )}
                animate={{
                  opacity: composingDone ? 1 : 0.35,
                }}
                transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              >
                <Send className="h-3 w-3" />
                Send
              </motion.span>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            className="space-y-2"
          >
            <div className="space-y-1.5 rounded-md bg-bg-surface p-2.5">
              <div className="flex items-baseline gap-2 text-[12px]">
                <span className="text-text-muted font-mono">To</span>
                <span className="text-text-primary">{toLabel}</span>
              </div>
              <div className="flex items-baseline gap-2 text-[12px]">
                <span className="text-text-muted font-mono">Subject</span>
                <span className="text-text-primary font-medium">{subject}</span>
              </div>
              <div className="border-b border-border-subtle/30" />
              <p className="whitespace-pre-wrap pt-1 text-[13px] leading-relaxed text-text-secondary">
                <AgentLinkText text={body} />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
