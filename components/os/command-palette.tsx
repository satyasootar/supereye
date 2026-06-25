'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/app-store';
import { useTheme } from 'next-themes';
import { useWorkspaces } from '@/hooks/use-workspaces';
import { useSuperSearch } from '@/hooks/use-super-search';
import { navigateSuperSearchResult } from '@/lib/search/navigate-result';
import { PluginBrandIcon } from '@/components/onboarding/plugin-brand-icon';
import {
  Search,
  Mail,
  Calendar,
  Settings,
  Moon,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShortcutKbd } from '@/components/keyboard/shortcuts-reference';
import type { LucideIcon } from 'lucide-react';
import type { PluginId } from '@/lib/plugins/types';
import type { SuperSearchResult } from '@/lib/search/types';

type Command = {
  id: string;
  category: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  action: () => void;
};

type PaletteItem =
  | { kind: 'command'; command: Command }
  | { kind: 'search'; result: SuperSearchResult };

export function superSearchCategory(kind: string): string {
  switch (kind) {
    case 'email':
      return 'Super Search · Email';
    case 'calendar':
      return 'Super Search · Calendar';
    case 'github_repo':
    case 'github_pull':
    case 'github_issue':
      return 'Super Search · GitHub';
    case 'drive_file':
    case 'drive_folder':
      return 'Super Search · Drive';
    default:
      return 'Super Search';
  }
}

const SPRING = { type: 'spring' as const, duration: 0.38, bounce: 0.14 };

function formatSearchDate(date?: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: parsed.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

export function CommandPalette() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { focusPlugin, activePlugins } = useWorkspaces();
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setComposeOpen,
    setEmailCategory,
    setCalendarView,
    setCurrentDateStr,
    setSelectedEmailId,
    openGithubRepo,
    openGithubItem,
    openDriveFolder,
    openDriveFile,
  } = useAppStore();
  const { setTheme, theme } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const superSearchEnabled = isCommandPaletteOpen && search.trim().length >= 2;
  const {
    data: superSearchData,
    isFetching: isSuperSearchFetching,
    isError: isSuperSearchError,
  } = useSuperSearch(search, superSearchEnabled);

  const transition = reduceMotion ? { duration: 0 } : SPRING;

  const runCommand = useCallback(
    (action: () => void) => {
      setCommandPaletteOpen(false);
      requestAnimationFrame(() => action());
    },
    [setCommandPaletteOpen]
  );

  const focusPluginIfAvailable = useCallback(
    (pluginId: PluginId) => {
      if (activePlugins.includes(pluginId)) {
        void focusPlugin(pluginId);
      }
    },
    [activePlugins, focusPlugin]
  );

  const navigateSearch = useCallback(
    (result: SuperSearchResult) => {
      navigateSuperSearchResult(result, {
        focusPlugin: (pluginId) => focusPluginIfAvailable(pluginId as PluginId),
        setSelectedEmailId,
        setEmailCategory,
        setCurrentDateStr,
        setCalendarView,
        openGithubRepo,
        openGithubItem,
        openDriveFolder,
        openDriveFile,
      });
    },
    [
      focusPluginIfAvailable,
      openDriveFile,
      openDriveFolder,
      openGithubItem,
      openGithubRepo,
      setCalendarView,
      setCurrentDateStr,
      setEmailCategory,
      setSelectedEmailId,
    ]
  );

  const commands = useMemo<Command[]>(
    () => [
      {
        id: 'compose-email',
        category: 'Recently used',
        label: 'Compose new email',
        icon: Mail,
        shortcut: 'C',
        action: () => {
          focusPluginIfAvailable('email');
          setComposeOpen(true);
        },
      },
      {
        id: 'create-event',
        category: 'Recently used',
        label: 'Create event',
        icon: Calendar,
        shortcut: 'N',
        action: () => {
          focusPluginIfAvailable('calendar');
          window.dispatchEvent(new CustomEvent('supereye:calendar-create'));
        },
      },
      {
        id: 'go-inbox',
        category: 'Email',
        label: 'Go to Inbox',
        icon: Mail,
        shortcut: 'G I',
        action: () => {
          focusPluginIfAvailable('email');
          setEmailCategory('INBOX');
        },
      },
      {
        id: 'go-sent',
        category: 'Email',
        label: 'Go to Sent',
        icon: Mail,
        shortcut: 'G S',
        action: () => {
          focusPluginIfAvailable('email');
          setEmailCategory('SENT');
        },
      },
      {
        id: 'go-today',
        category: 'Calendar',
        label: 'Go to today',
        icon: Calendar,
        shortcut: 'T',
        action: () => {
          focusPluginIfAvailable('calendar');
          setCurrentDateStr(new Date().toISOString());
        },
      },
      {
        id: 'switch-month',
        category: 'Calendar',
        label: 'Switch to month view',
        icon: Calendar,
        shortcut: 'M',
        action: () => {
          focusPluginIfAvailable('calendar');
          setCalendarView('Month');
        },
      },
      {
        id: 'settings',
        category: 'App',
        label: 'Open profile & settings',
        icon: Settings,
        shortcut: '⌘,',
        action: () => router.push('/workspace/profile'),
      },
      {
        id: 'theme',
        category: 'App',
        label: 'Toggle dark / light mode',
        icon: Moon,
        action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
    ],
    [
      focusPluginIfAvailable,
      router,
      setCalendarView,
      setComposeOpen,
      setCurrentDateStr,
      setEmailCategory,
      setTheme,
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

  const paletteItems = useMemo<PaletteItem[]>(() => {
    const searchResults = superSearchData?.results ?? [];
    const items: PaletteItem[] = searchResults.map((result) => ({
      kind: 'search',
      result,
    }));
    for (const command of filteredCommands) {
      items.push({ kind: 'command', command });
    }
    return items;
  }, [filteredCommands, superSearchData?.results]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, PaletteItem[]> = {};
    for (const item of paletteItems) {
      const category =
        item.kind === 'search'
          ? superSearchCategory(item.result.kind)
          : item.command.category;
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    }
    return groups;
  }, [paletteItems]);

  const getItemId = useCallback((item: PaletteItem) => {
    if (item.kind === 'command') return item.command.id;
    return `search:${item.result.kind}:${item.result.id}`;
  }, []);

  const executeItem = useCallback(
    (item: PaletteItem) => {
      if (item.kind === 'command') {
        runCommand(item.command.action);
      } else {
        runCommand(() => navigateSearch(item.result));
      }
    },
    [navigateSearch, runCommand]
  );

  const executeSelected = useCallback(() => {
    const item = paletteItems[selectedIndex];
    if (!item) return;
    executeItem(item);
  }, [executeItem, paletteItems, selectedIndex]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search, superSearchData?.results]);

  const selectedItemId = paletteItems[selectedIndex]
    ? getItemId(paletteItems[selectedIndex])
    : undefined;

  useEffect(() => {
    if (!selectedItemId || !listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-palette-id="${selectedItemId}"]`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedItemId]);

  useEffect(() => {
    if (!isCommandPaletteOpen) return;

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (paletteItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % paletteItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + paletteItems.length) % paletteItems.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelected();
    }
  };

  const showSuperSearchHint = search.trim().length > 0 && search.trim().length < 2;
  const showEmptyState =
    paletteItems.length === 0 &&
    !isSuperSearchFetching &&
    search.trim().length >= 2;

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
            className="absolute inset-0 z-0 bg-bg-app/75 backdrop-blur-md"
            onMouseDown={() => setCommandPaletteOpen(false)}
            style={{ willChange: 'opacity' }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={transition}
            onAnimationComplete={() => {
              if (isCommandPaletteOpen) {
                inputRef.current?.focus();
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="relative z-10 flex w-full max-w-[640px] flex-col overflow-hidden rounded-xl border border-border-default bg-bg-elevated shadow-2xl shadow-black/40 max-h-[min(70vh,560px)]"
            style={{ willChange: 'transform, opacity' }}
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
                {isSuperSearchFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </div>
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Super Search emails, calendar, GitHub, Drive…"
                className="h-[52px] flex-1 bg-transparent text-[16px] text-text-primary outline-none placeholder:text-text-muted"
              />
              <ShortcutKbd keys="esc" className="hidden sm:inline-flex" />
            </div>

            <div ref={listRef} className="custom-scrollbar flex-1 overflow-y-auto px-2 py-2">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="mb-1">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                      {category}
                    </span>
                    <div className="h-px flex-1 bg-border-subtle" />
                  </div>

                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      const currentIndex = absoluteIndex++;
                      const isSelected = currentIndex === selectedIndex;
                      const itemId = getItemId(item);

                      if (item.kind === 'search') {
                        const { result } = item;
                        const dateLabel = formatSearchDate(result.date);

                        return (
                          <li key={itemId} className="relative">
                            <button
                              type="button"
                              data-palette-id={itemId}
                              className={cn(
                                'relative flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-[background-color,border-color,color] duration-75',
                                isSelected
                                  ? 'border border-accent-blue/25 bg-accent-blue/10 text-text-primary'
                                  : 'border border-transparent text-text-secondary hover:bg-bg-overlay hover:text-text-primary'
                              )}
                              onMouseEnter={() => setSelectedIndex(currentIndex)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => executeItem(item)}
                            >
                              <span className="relative flex min-w-0 items-center gap-3">
                                <span
                                  className={cn(
                                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors duration-75',
                                    isSelected
                                      ? 'border-accent-blue/30 bg-bg-elevated'
                                      : 'border-border-subtle bg-bg-surface'
                                  )}
                                >
                                  <PluginBrandIcon pluginId={result.pluginId} size={14} />
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-[14px] font-medium">
                                    {result.title}
                                  </span>
                                  {result.subtitle && (
                                    <span className="block truncate text-[12px] text-text-muted">
                                      {result.subtitle}
                                    </span>
                                  )}
                                </span>
                              </span>
                              {dateLabel && (
                                <span className="shrink-0 text-[11px] text-text-muted">
                                  {dateLabel}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      }

                      const cmd = item.command;
                      return (
                        <li key={itemId} className="relative">
                          <button
                            type="button"
                            data-palette-id={itemId}
                            className={cn(
                              'relative flex h-10 w-full items-center justify-between gap-3 rounded-md px-3 text-left transition-[background-color,border-color,color] duration-75',
                              isSelected
                                ? 'border border-accent-blue/25 bg-accent-blue/10 text-text-primary'
                                : 'border border-transparent text-text-secondary hover:bg-bg-overlay hover:text-text-primary'
                            )}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeItem(item)}
                          >
                            <span className="relative flex min-w-0 items-center gap-3">
                              <span
                                className={cn(
                                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors duration-75',
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
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              {showSuperSearchHint && (
                <p className="px-3 py-8 text-center text-[13px] text-text-muted">
                  Type at least 2 characters to Super Search your workspace
                </p>
              )}

              <AnimatePresence mode="wait">
                {showEmptyState && (
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
                      {isSuperSearchError ? 'Search unavailable' : 'No results found'}
                    </p>
                    <p className="text-[13px] text-text-muted">
                      {isSuperSearchError
                        ? 'Try again in a moment'
                        : 'Try a different search term or command'}
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
                {paletteItems.length} result{paletteItems.length === 1 ? '' : 's'}
                {superSearchData?.meta.tookMs != null && search.trim().length >= 2
                  ? ` · ${superSearchData.meta.tookMs}ms`
                  : ''}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
