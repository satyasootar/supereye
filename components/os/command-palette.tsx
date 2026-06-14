'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/app-store';
import { useTheme } from 'next-themes';
import { useKeyboardStore } from '@/lib/keyboard/keyboard-store';
import {
  Search,
  Mail,
  Calendar,
  Settings,
  Moon,
  TerminalSquare,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShortcutKbd } from '@/components/keyboard/shortcuts-reference';
import type { LucideIcon } from 'lucide-react';

type Command = {
  id: string;
  category: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
};

const SPRING = { type: 'spring' as const, duration: 0.38, bounce: 0.14 };

export function CommandPalette() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { isCommandPaletteOpen, setCommandPaletteOpen, openTab, setWorkspaceMode } =
    useAppStore();
  const { setTheme, theme } = useTheme();
  const { setCheatSheetOpen } = useKeyboardStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const transition = reduceMotion ? { duration: 0 } : SPRING;

  const commands = useMemo<Command[]>(
    () => [
      {
        id: 'compose-email',
        category: 'Recently used',
        label: 'Compose new email',
        icon: Mail,
        shortcut: 'C',
        action: () => openTab('email'),
      },
      {
        id: 'create-event',
        category: 'Recently used',
        label: 'Create event',
        icon: Calendar,
        shortcut: 'N',
        action: () => {
          openTab('email');
          setWorkspaceMode('calendar');
        },
      },
      {
        id: 'go-inbox',
        category: 'Email',
        label: 'Go to Inbox',
        icon: Mail,
        shortcut: 'G I',
        action: () => openTab('email'),
      },
      {
        id: 'go-sent',
        category: 'Email',
        label: 'Go to Sent',
        icon: Mail,
        shortcut: 'G S',
        action: () => openTab('email'),
      },
      {
        id: 'go-today',
        category: 'Calendar',
        label: 'Go to today',
        icon: Calendar,
        shortcut: 'T',
        action: () => {
          openTab('email');
          setWorkspaceMode('calendar');
        },
      },
      {
        id: 'switch-month',
        category: 'Calendar',
        label: 'Switch to month view',
        icon: Calendar,
        shortcut: 'M',
        action: () => {
          openTab('email');
          setWorkspaceMode('calendar');
        },
      },
      {
        id: 'settings',
        category: 'App',
        label: 'Open profile & settings',
        icon: Settings,
        shortcut: '⌘,',
        action: () => {
          setCommandPaletteOpen(false);
          router.push('/workspace/profile');
        },
      },
      {
        id: 'theme',
        category: 'App',
        label: 'Toggle dark / light mode',
        icon: Moon,
        action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'shortcuts',
        category: 'App',
        label: 'Show keyboard shortcuts',
        icon: TerminalSquare,
        shortcut: '?',
        action: () => {
          setCommandPaletteOpen(false);
          setCheatSheetOpen(true);
        },
      },
    ],
    [
      openTab,
      router,
      setCheatSheetOpen,
      setCommandPaletteOpen,
      setTheme,
      setWorkspaceMode,
      theme,
    ]
  );

  const filteredCommands = useMemo(
    () =>
      commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(search.toLowerCase()) ||
          cmd.category.toLowerCase().includes(search.toLowerCase())
      ),
    [commands, search]
  );

  const groupedCommands = useMemo(
    () =>
      filteredCommands.reduce(
        (acc, cmd) => {
          if (!acc[cmd.category]) acc[cmd.category] = [];
          acc[cmd.category].push(cmd);
          return acc;
        },
        {} as Record<string, Command[]>
      ),
    [filteredCommands]
  );

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!isCommandPaletteOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setCommandPaletteOpen(false);
        return;
      }

      if (filteredCommands.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filteredCommands[selectedIndex]?.action();
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    filteredCommands,
    isCommandPaletteOpen,
    selectedIndex,
    setCommandPaletteOpen,
  ]);

  let absoluteIndex = 0;

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[min(15vh,120px)]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="absolute inset-0 bg-bg-app/75 backdrop-blur-md"
            onClick={() => setCommandPaletteOpen(false)}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={transition}
            className="relative flex w-full max-w-[640px] flex-col overflow-hidden rounded-xl border border-border-default bg-bg-elevated shadow-2xl shadow-black/40 max-h-[min(70vh,560px)]"
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60"
              style={{
                background:
                  'radial-gradient(ellipse 80% 70% at 50% -20%, var(--accent-blue-glow), transparent)',
              }}
            />

            <div className="relative flex shrink-0 items-center gap-3 border-b border-border-subtle px-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-surface text-text-muted">
                <Search className="h-4 w-4" />
              </div>
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a command or search…"
                className="h-[52px] flex-1 bg-transparent text-[16px] text-text-primary outline-none placeholder:text-text-muted"
              />
              <ShortcutKbd keys="esc" className="hidden sm:inline-flex" />
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto px-2 py-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {Object.entries(groupedCommands).map(([category, cmds], groupIndex) => (
                  <motion.div
                    key={category}
                    layout
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{
                      ...transition,
                      delay: reduceMotion ? 0 : groupIndex * 0.03,
                    }}
                    className="mb-1"
                  >
                    <div className="flex items-center gap-3 px-3 py-2">
                      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                        {category}
                      </span>
                      <div className="h-px flex-1 bg-border-subtle" />
                    </div>

                    <ul className="space-y-0.5">
                      {cmds.map((cmd) => {
                        const currentIndex = absoluteIndex++;
                        const isSelected = currentIndex === selectedIndex;

                        return (
                          <motion.li
                            key={cmd.id}
                            layout
                            initial={false}
                            className="relative"
                          >
                            <button
                              type="button"
                              className={cn(
                                'relative flex h-10 w-full items-center justify-between gap-3 rounded-md px-3 text-left transition-colors',
                                isSelected
                                  ? 'text-text-primary'
                                  : 'text-text-secondary hover:text-text-primary'
                              )}
                              onMouseEnter={() => setSelectedIndex(currentIndex)}
                              onClick={() => {
                                cmd.action();
                                setCommandPaletteOpen(false);
                              }}
                            >
                              {isSelected && (
                                <motion.div
                                  layoutId="command-palette-active"
                                  className="absolute inset-0 rounded-md border border-accent-blue/25 bg-accent-blue/10"
                                  transition={transition}
                                />
                              )}

                              <span className="relative flex min-w-0 items-center gap-3">
                                <span
                                  className={cn(
                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors',
                                    isSelected
                                      ? 'border-accent-blue/30 bg-bg-elevated text-accent-blue'
                                      : 'border-border-subtle bg-bg-surface text-text-muted'
                                  )}
                                >
                                  <cmd.icon className="h-3.5 w-3.5" />
                                </span>
                                <span className="truncate text-[14px] font-medium">
                                  {cmd.label}
                                </span>
                              </span>

                              {cmd.shortcut && (
                                <ShortcutKbd
                                  keys={cmd.shortcut}
                                  className={cn(
                                    'relative',
                                    isSelected && 'border-accent-blue/20 bg-bg-elevated/80'
                                  )}
                                />
                              )}
                            </button>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </motion.div>
                ))}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {filteredCommands.length === 0 && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={transition}
                    className="flex flex-col items-center justify-center gap-2 py-16 text-center"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border-subtle bg-bg-surface text-text-muted">
                      <Search className="h-4 w-4" />
                    </div>
                    <p className="text-[14px] font-medium text-text-primary">
                      No matching commands
                    </p>
                    <p className="text-[13px] text-text-muted">
                      Try a different search term
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border-subtle bg-bg-surface/50 px-4 py-2.5">
              <div className="flex items-center gap-3 text-[11px] text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  <ArrowDown className="h-3 w-3" />
                  navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <CornerDownLeft className="h-3 w-3" />
                  select
                </span>
              </div>
              <span className="text-[11px] text-text-muted">
                {filteredCommands.length} command
                {filteredCommands.length === 1 ? '' : 's'}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
