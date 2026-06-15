'use client';

import { useEffect, useMemo, useState } from 'react';
import { keybindingRegistry } from '@/lib/keyboard/registry';
import { sequenceToLabel } from '@/lib/keyboard/key-parser';
import { useKeyboardStore } from '@/lib/keyboard/keyboard-store';
import { ProfileSection } from '@/components/profile/profile-section';
import { Button } from '@/components/ui/button';

export function KeyboardShortcutsSection() {
  const { overrides, setOverride, removeOverride } = useKeyboardStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [remapInput, setRemapInput] = useState('');

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
        description="A small set of essentials — workspace switching and plugin cycling. Uses Ctrl on Windows and ⌘ on Mac."
      >
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
      </ProfileSection>
    </div>
  );
}
