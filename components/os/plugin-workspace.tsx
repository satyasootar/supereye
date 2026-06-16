'use client';

import { EmailReader } from './email-reader';
import { EmailListFull } from './email-list-full';
import { CalendarSidebar } from './calendar-sidebar';
import { CalendarGrid } from './calendar-grid';
import { EmailCompactPanel } from './email-compact-panel';
import { GithubMainPanel } from './github-main-panel';
import { GithubCompactPanel } from './github-compact-panel';
import { useAppStore } from '@/lib/store/app-store';
import { useWorkspaceLayout } from '@/hooks/use-workspace-layout';
import { getPlugin } from '@/lib/plugins/registry';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Mail,
  Inbox,
  Plus,
  Clock,
  PanelRightClose,
  PanelRightOpen,
  GitPullRequest,
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { CreateEventModal } from './create-event-modal';
import Link from 'next/link';
import type { PluginId } from '@/lib/plugins/types';

const springTransition = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 32,
  mass: 0.9,
};

function EmailMainPanel() {
  const { selectedEmailId } = useAppStore();
  const [splitRatio, setSplitRatio] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.userSelect = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || !overlayRef.current || !listRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
    if (newRatio >= 20 && newRatio <= 80) {
      listRef.current.style.width = `${newRatio}%`;
      overlayRef.current.style.width = `${100 - newRatio}%`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.userSelect = '';
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
      if (newRatio >= 20 && newRatio <= 80) setSplitRatio(newRatio);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden" ref={containerRef}>
      <div
        ref={listRef}
        className="flex h-full min-h-0 flex-shrink-0 flex-col overflow-hidden"
        style={{ width: selectedEmailId ? `${splitRatio}%` : '100%' }}
      >
        <EmailListFull />
      </div>
      {selectedEmailId && (
        <div
          ref={overlayRef}
          className="relative flex h-full min-h-0 min-w-0 flex-1 border-l border-border-subtle animate-in slide-in-from-right-8 duration-200"
          style={{ width: `${100 - splitRatio}%` }}
        >
          <div
            className={cn(
              'absolute top-0 bottom-0 left-0 -ml-[3px] z-50 w-1.5 cursor-col-resize bg-transparent transition-colors hover:bg-accent-blue',
              isDragging && 'bg-accent-blue'
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <EmailReader />
          </div>
        </div>
      )}
    </div>
  );
}

function SecondaryPanel({
  pluginId,
  expanded,
  onToggle,
}: {
  pluginId: PluginId;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = getPlugin(pluginId);
  const isEmail = pluginId === 'email';
  const isCalendar = pluginId === 'calendar';
  const isGithub = pluginId === 'github';
  const Icon = isEmail ? Mail : isCalendar ? Calendar : GitPullRequest;
  const width = isEmail ? 400 : isGithub ? 360 : 320;

  return (
    <motion.div
      key={pluginId}
      className="relative h-full flex-shrink-0 overflow-hidden border-l border-border-subtle bg-bg-surface"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: expanded ? width : 48, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={springTransition}
    >
      {/* Expanded Content */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 flex flex-col bg-bg-surface"
        style={{ width, pointerEvents: expanded ? 'auto' : 'none' }}
        animate={{ opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border-subtle bg-bg-surface px-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggle}
              className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-overlay hover:text-text-primary"
              title="Collapse panel"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
            <Icon className="h-4 w-4 text-accent-blue" />
            <span className="text-[14px] font-semibold text-text-primary">
              {meta?.shortLabel ?? pluginId}
            </span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden bg-bg-surface">
          {isEmail && <EmailCompactPanel hideHeader />}
          {isCalendar && <CalendarSidebar variant="right-panel" />}
          {isGithub && <GithubCompactPanel hideHeader />}
        </div>
      </motion.div>

      {/* Collapsed Content */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 flex w-[48px] flex-col items-center gap-2 bg-bg-surface py-3"
        style={{ pointerEvents: expanded ? 'none' : 'auto' }}
        animate={{ opacity: expanded ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <button
          type="button"
          onClick={onToggle}
          title="Expand panel"
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-accent-blue/10 hover:text-accent-blue"
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>
        {isEmail && (
          <button
            type="button"
            onClick={onToggle}
            title="Inbox"
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-overlay hover:text-text-primary"
          >
            <Inbox className="h-4 w-4" />
          </button>
        )}
        {isCalendar && (
          <>
            <CreateEventModal
              trigger={
                <button
                  type="button"
                  title="New Event"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-overlay hover:text-text-primary"
                >
                  <Plus className="h-4 w-4" />
                </button>
              }
            />
            <button
              type="button"
              onClick={onToggle}
              title="Upcoming Events"
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-overlay hover:text-text-primary"
            >
              <Clock className="h-4 w-4" />
            </button>
          </>
        )}
        {isGithub && (
          <button
            type="button"
            onClick={onToggle}
            title="GitHub activity"
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-overlay hover:text-text-primary"
          >
            <GitPullRequest className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

function NoPluginsState() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 bg-bg-app px-6 text-center">
      <div className="rounded-xl border border-border-default bg-bg-elevated px-8 py-10 shadow-sm">
        <h2 className="text-[18px] font-semibold text-text-primary">Connect your tools</h2>
        <p className="mt-2 max-w-sm text-[14px] text-text-muted">
          Link Email, Calendar, or GitHub to populate your workspace. You can add integrations anytime.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/workspace/onboarding"
            className="rounded-md bg-accent-blue px-4 py-2 text-[13px] font-semibold text-text-inverse transition-colors hover:bg-accent-blue-dim"
          >
            Set up integrations
          </Link>
          <Link
            href="/workspace/profile?tab=connections"
            className="rounded-md border border-border-default px-4 py-2 text-[13px] font-medium text-text-primary transition-colors hover:bg-bg-highlight"
          >
            Profile settings
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PluginWorkspace() {
  const { activePlugins, primary, sidebar, hasSecondary, focusPlugin, isLoading } =
    useWorkspaceLayout();
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(true);

  if (!isLoading && activePlugins.length === 0) {
    return <NoPluginsState />;
  }

  const renderMain = () => {
    if (primary === 'calendar') return <CalendarGrid />;
    if (primary === 'email') return <EmailMainPanel />;
    if (primary === 'github') return <GithubMainPanel />;
    return null;
  };

  return (
    <LayoutGroup>
      <div className="flex h-full w-full overflow-hidden bg-bg-app">
        <div className="flex h-full flex-1 overflow-hidden">
          {/* Main Panel Content with Slide Transition */}
          <div className="relative h-full flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={primary}
                className="absolute inset-0 h-full w-full"
                initial={{ opacity: 0, x: primary === 'calendar' ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: primary === 'calendar' ? 30 : -30 }}
                transition={springTransition}
              >
                {renderMain()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Sidebar Panel */}
          {hasSecondary && sidebar && activePlugins.includes(sidebar) && (
            <AnimatePresence mode="wait" initial={false}>
              <SecondaryPanel
                key={sidebar}
                pluginId={sidebar}
                expanded={isRightPanelExpanded}
                onToggle={() => setIsRightPanelExpanded((v) => !v)}
              />
            </AnimatePresence>
          )}
        </div>
      </div>
    </LayoutGroup>
  );
}

/** @deprecated Use PluginWorkspace — kept for import compatibility */
export const EmailPane = PluginWorkspace;
