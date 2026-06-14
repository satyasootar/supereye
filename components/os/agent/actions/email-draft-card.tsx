'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentAction } from '@/lib/store/app-store';
import { cn } from '@/lib/utils';
import { Mail } from 'lucide-react';

function useLiveTyping(text: string, active: boolean, speed = 18) {
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
  const isRunning = action.status === 'running';
  const [showPreview, setShowPreview] = useState(false);

  const { visible: typedSubject, done: subjectDone } = useLiveTyping(
    subject,
    isRunning && !showPreview,
    24
  );
  const { visible: typedBody, done: bodyDone } = useLiveTyping(
    body,
    isRunning && subjectDone && !showPreview,
    14
  );

  useEffect(() => {
    if (bodyDone && action.groupId) {
      const timer = setTimeout(() => {
        setShowPreview(true);
        onDraftComplete?.(action.groupId!);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [bodyDone, action.groupId, onDraftComplete]);

  useEffect(() => {
    if (action.status === 'done') setShowPreview(true);
  }, [action.status]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-xl border border-border-default bg-bg-elevated/70 backdrop-blur-md"
    >
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
        <Mail className="h-3.5 w-3.5 text-accent-blue" />
        <span className="text-[12px] font-semibold text-text-primary">
          {showPreview ? 'Email ready' : 'Drafting email'}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!showPreview ? (
          <motion.div
            key="composer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3 px-4 py-3 font-mono text-[12px]"
          >
            <div className="text-text-muted">
              To:{' '}
              <span className="text-text-secondary">{toLabel || '···'}</span>
            </div>
            <div className="text-text-muted">
              Subject:{' '}
              <span className="text-text-primary">
                {typedSubject}
                {isRunning && !subjectDone && <BlinkCursor />}
              </span>
            </div>
            <div className="min-h-[72px] whitespace-pre-wrap rounded-lg border border-border-subtle/80 bg-bg-surface/50 p-3 text-[13px] leading-relaxed text-text-primary">
              {typedBody}
              {isRunning && subjectDone && !bodyDone && <BlinkCursor />}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-4 py-3"
          >
            <div className="rounded-lg border border-accent-blue/20 bg-accent-blue/5 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">To</p>
              <p className="text-[13px] text-text-primary">{toLabel}</p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">Subject</p>
              <p className="text-[13px] font-medium text-text-primary">{subject}</p>
              <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">Message</p>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-text-secondary">{body}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
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
