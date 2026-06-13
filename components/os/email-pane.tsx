'use client';

import { EmailSidebar } from './email-sidebar';
import { EmailReader } from './email-reader';
import { EmailListFull } from './email-list-full';
import { CalendarSidebar } from './calendar-sidebar';
import { CalendarGrid } from './calendar-grid';
import { EmailCompactPanel } from './email-compact-panel';
import { useAppStore } from '@/lib/store/app-store';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, Calendar, Mail, Inbox, Plus, Clock } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { CreateEventModal } from './create-event-modal';

const springTransition = {
  type: 'spring' as const,
  stiffness: 280,
  damping: 32,
  mass: 0.9,
};

export function EmailPane() {
  const { selectedEmailId, workspaceMode, setWorkspaceMode } = useAppStore();
  const [splitRatio, setSplitRatio] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(true);

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

  const isCalendarMode = workspaceMode === 'calendar';

  return (
    <LayoutGroup>
      <div className="flex h-full w-full overflow-hidden bg-bg-app">
        {/* Sidebar — always present */}
        <EmailSidebar />

        <AnimatePresence mode="wait" initial={false}>
          {isCalendarMode ? (
            /* ═══════════ CALENDAR FOCUS LAYOUT ═══════════ */
            <motion.div
              key="calendar-focus"
              className="flex flex-1 h-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Left: Calendar Agenda Panel */}
              <motion.div
                className="h-full flex-shrink-0 border-r border-border-strong bg-bg-surface overflow-hidden"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={springTransition}
              >
                <CalendarSidebar variant="default" />
              </motion.div>

              {/* Center: Full Calendar Grid (inline, not modal) */}
              <motion.div
                className="flex-1 h-full overflow-hidden"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ ...springTransition, delay: 0.05 }}
              >
                <CalendarGrid />
              </motion.div>

              {/* Right: Email Panel — Expandable/Collapsible */}
              <AnimatePresence initial={false}>
                <motion.div
                  key={isRightPanelExpanded ? 'email-expanded' : 'email-collapsed'}
                  className="h-full flex-shrink-0 border-l border-border-strong overflow-hidden relative"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: isRightPanelExpanded ? 400 : 48, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={springTransition}
                >
                  {isRightPanelExpanded ? (
                    /* Expanded Email Panel */
                    <div className="flex flex-col h-full w-[400px] bg-bg-surface">
                      {/* Unified Right Panel Header */}
                      <div className="flex h-12 flex-shrink-0 items-center justify-between px-3 border-b border-border-subtle bg-bg-surface">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsRightPanelExpanded(false)}
                            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
                            title="Collapse Email Panel"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <Mail className="h-4 w-4 text-accent-blue" />
                          <span className="text-[14px] font-semibold text-text-primary">Email</span>
                        </div>
                        <button
                          onClick={() => setWorkspaceMode('email')}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold text-accent-blue bg-accent-blue/10 hover:bg-accent-blue/20 transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Focus
                        </button>
                      </div>
                      <div className="flex-1 overflow-hidden bg-bg-surface">
                        <EmailCompactPanel hideHeader={true} />
                      </div>
                    </div>
                  ) : (
                    /* Collapsed Email Dock */
                    <div className="flex h-full w-[48px] flex-col items-center bg-bg-surface py-3 gap-2">
                      {/* Expand Arrow */}
                      <button
                        onClick={() => setIsRightPanelExpanded(true)}
                        title="Expand Email Panel"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <div className="w-6 border-t border-border-subtle my-1" />

                      {/* Switch to Email Focus */}
                      <button
                        onClick={() => setWorkspaceMode('email')}
                        title="Switch to Email Focus"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                      </button>

                      {/* Inbox icon */}
                      <button
                        onClick={() => setIsRightPanelExpanded(true)}
                        title="Inbox"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
                      >
                        <Inbox className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            /* ═══════════ EMAIL FOCUS LAYOUT (DEFAULT) ═══════════ */
            <motion.div
              key="email-focus"
              className="flex flex-1 h-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Center: Email List + Reader */}
              <div className="flex-1 flex overflow-hidden" ref={containerRef}>
                {/* Email List */}
                <div
                  ref={listRef}
                  className="h-full overflow-hidden flex-shrink-0"
                  style={{ width: selectedEmailId ? `${splitRatio}%` : '100%' }}
                >
                  <EmailListFull />
                </div>

                {/* Reader */}
                {selectedEmailId && (
                  <div
                    ref={overlayRef}
                    className="flex h-full border-l border-border-subtle relative animate-in slide-in-from-right-8 duration-200"
                    style={{ width: `${100 - splitRatio}%` }}
                  >
                    {/* Resizer Handle */}
                    <div
                      className={cn(
                        "w-1.5 absolute left-0 top-0 bottom-0 -ml-[3px] bg-transparent hover:bg-accent-blue transition-colors cursor-col-resize z-50",
                        isDragging && "bg-accent-blue"
                      )}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                    />
                    <div className="flex-1 h-full overflow-hidden">
                      <EmailReader />
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Calendar Panel — Expandable/Collapsible */}
              <AnimatePresence initial={false}>
                <motion.div
                  key={isRightPanelExpanded ? 'cal-expanded' : 'cal-collapsed'}
                  className="relative flex-shrink-0 border-l border-border-subtle bg-bg-surface overflow-hidden"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: isRightPanelExpanded ? 320 : 48, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={springTransition}
                >
                  {isRightPanelExpanded ? (
                    /* Expanded Calendar Panel */
                    <div className="flex flex-col h-full w-[320px] bg-bg-surface">
                      {/* Unified Right Panel Header */}
                      <div className="flex h-12 flex-shrink-0 items-center justify-between px-3 border-b border-border-subtle bg-bg-surface">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsRightPanelExpanded(false)}
                            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
                            title="Collapse Calendar Panel"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <Calendar className="h-4 w-4 text-accent-blue" />
                          <span className="text-[14px] font-semibold text-text-primary">Calendar</span>
                        </div>
                        <button
                          onClick={() => setWorkspaceMode('calendar')}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold text-accent-blue bg-accent-blue/10 hover:bg-accent-blue/20 transition-colors"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          Focus
                        </button>
                      </div>
                      <div className="flex-1 overflow-hidden bg-bg-surface">
                        <CalendarSidebar variant="right-panel" />
                      </div>
                    </div>
                  ) : (
                    /* Collapsed Calendar Dock */
                    <div className="flex h-full w-[48px] flex-col items-center bg-bg-surface py-3 gap-2">
                      {/* Expand Arrow */}
                      <button
                        onClick={() => setIsRightPanelExpanded(true)}
                        title="Expand Calendar"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-accent-blue hover:bg-accent-blue/10 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <div className="w-6 border-t border-border-subtle my-1" />

                      {/* Switch to Calendar Focus */}
                      <button
                        onClick={() => setWorkspaceMode('calendar')}
                        title="Switch to Calendar Focus"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/25 transition-colors"
                      >
                        <Calendar className="h-4 w-4" />
                      </button>

                      {/* New Event */}
                      <CreateEventModal trigger={
                        <button
                          title="New Event"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      } />

                      {/* Upcoming */}
                      <button
                        onClick={() => setIsRightPanelExpanded(true)}
                        title="Upcoming Events"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-overlay transition-colors"
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
