'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { keybindingRegistry } from '@/lib/keyboard/registry';
import { sequenceToLabel } from '@/lib/keyboard/key-parser';
import { useKeyboardStore } from '@/lib/keyboard/keyboard-store';
import { ProfileSection, ProfileRow } from '@/components/profile/profile-section';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { USER_PREFERENCES_KEY } from '@/hooks/use-workspaces';

export function KeyboardShortcutsSection() {
  const queryClient = useQueryClient();
  const { overrides, setOverride, removeOverride, keybindingsEnabled, setKeybindingsEnabled } =
    useKeyboardStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [remapInput, setRemapInput] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: prefData } = useQuery({
    queryKey: USER_PREFERENCES_KEY,
    queryFn: async () => {
      const res = await fetch('/api/user/preferences');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    if (typeof prefData?.keybindingsEnabled === 'boolean') {
      setKeybindingsEnabled(prefData.keybindingsEnabled);
    }
  }, [prefData?.keybindingsEnabled, setKeybindingsEnabled]);

  const updateKeybindingsEnabled = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keybindingsEnabled: enabled }),
      });
      if (!res.ok) throw new Error('Failed to update preference');
      return res.json();
    },
    onMutate: (enabled) => {
      setKeybindingsEnabled(enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_PREFERENCES_KEY });
    },
    onError: () => {
      setKeybindingsEnabled(prefData?.keybindingsEnabled ?? true);
    },
  });

  const enabled = mounted ? keybindingsEnabled : true;

  const grouped = useMemo(() => {
    const map = new Map<string, ReturnType<typeof keybindingRegistry.getBindings>>();
    for (const b of keybindingRegistry.getBindings()) {
      const list = map.get(b.group) ?? [];
      list.push(b);
      map.set(b.group, list);
    }
    return Array.from(map.entries());
  }, [overrides, editingId]);

  useEffect(() => {
    keybindingRegistry.setOverrides(overrides);
  }, [overrides]);

  const conflicts = keybindingRegistry.getConflicts();

  const startRemap = (id: string, current: string) => {
    setEditingId(id);
    setRemapInput(current);
  };

  const saveRemap = (id: string) => {
    const parts = remapInput
      .toLowerCase()
      .split(/\s*→\s*|\s+/)
      .filter(Boolean);
    if (parts.length === 0) return;
    setOverride(
      id,
      parts.map((key) => ({
        key: key === 'space' ? 'space' : key.length === 1 ? key : key,
        mod:
          remapInput.toLowerCase().includes('ctrl') ||
          remapInput.includes('⌘') ||
          remapInput.toLowerCase().includes('cmd'),
        ctrl: remapInput.toLowerCase().includes('ctrl') || undefined,
        meta:
          remapInput.includes('⌘') || remapInput.toLowerCase().includes('cmd') || undefined,
        shift: remapInput.includes('⇧') || remapInput.toLowerCase().includes('shift'),
      }))
    );
    keybindingRegistry.setOverrides(useKeyboardStore.getState().overrides);
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <ProfileSection
        title="Keyboard shortcuts"
        description="Workspace switching, compose, and AI shortcuts. Synced to your account."
      >
        <ProfileRow
          label="Enable keyboard shortcuts"
          description={
            enabled
              ? 'Shortcuts like 1/2 for workspaces and C for compose are active.'
              : 'All custom shortcuts are off — normal typing only.'
          }
        >
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={updateKeybindingsEnabled.isPending}
            onClick={() => updateKeybindingsEnabled.mutate(!enabled)}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              enabled ? 'bg-accent-blue' : 'bg-bg-overlay'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                enabled && 'translate-x-5'
              )}
            />
          </button>
        </ProfileRow>

        {!enabled && (
          <p className="mb-4 rounded-lg border border-border-subtle bg-bg-highlight px-3 py-2 text-[12px] text-text-muted">
            Keyboard shortcuts are disabled. Turn them back on to use workspace keys (
            <kbd className="rounded bg-bg-surface px-1 font-mono text-[11px]">1</kbd>–
            <kbd className="rounded bg-bg-surface px-1 font-mono text-[11px]">5</kbd>),{' '}
            <kbd className="rounded bg-bg-surface px-1 font-mono text-[11px]">Tab</kbd> to
            switch plugins, and more.
          </p>
        )}

        <div className={cn(!enabled && 'pointer-events-none opacity-50')}>
          <p className="mb-4 text-[12px] leading-relaxed text-text-muted">
            Press <kbd className="rounded bg-bg-highlight px-1 font-mono text-[11px]">?</kbd> in
            the app for a quick overlay. Remaps sync to your account.
          </p>

          {conflicts.length > 0 && (
            <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-700 dark:text-amber-300">
              {conflicts.length} binding conflict(s) detected — resolve remaps below.
            </p>
          )}

          {grouped.map(([group, bindings]) => (
            <div key={group} className="mb-6 last:mb-0">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {group}
              </h3>
              <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
                {bindings.map((b) => {
                  const keys = sequenceToLabel(b.sequence);
                  const isEditing = editingId === b.id;
                  const isRemapped = !!overrides[b.id];
                  return (
                    <li
                      key={b.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-[13px] text-text-primary">{b.description}</span>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <input
                              value={remapInput}
                              onChange={(e) => setRemapInput(e.target.value)}
                              placeholder="e.g. g → e or ctrl+k"
                              className="w-40 rounded-md border border-border-default bg-bg-surface px-2 py-1 text-[12px]"
                            />
                            <Button size="sm" onClick={() => saveRemap(b.id)}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <kbd className="rounded border border-border-subtle bg-bg-highlight px-2 py-0.5 font-mono text-[11px] text-text-muted">
                              {keys}
                            </kbd>
                            {isRemapped && (
                              <span className="text-[10px] text-accent-blue">custom</span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startRemap(b.id, keys)}
                            >
                              Remap
                            </Button>
                            {isRemapped && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  removeOverride(b.id);
                                  keybindingRegistry.setOverrides(
                                    useKeyboardStore.getState().overrides
                                  );
                                }}
                              >
                                Reset
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </ProfileSection>
    </div>
  );
}
