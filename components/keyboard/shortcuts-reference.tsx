'use client';

import { useEffect, useMemo } from 'react';
import { keybindingRegistry } from '@/lib/keyboard/registry';
import { sequenceToLabel, modKeyLabel } from '@/lib/keyboard/key-parser';
import type { KeybindingDefinition } from '@/lib/keyboard/types';
import { cn } from '@/lib/utils';

export type ShortcutEntry = {
  description: string;
  keys: string;
};

export function getFeaturedShortcuts(): ShortcutEntry[] {
  const mod = modKeyLabel();
  return [
    { description: 'Show all shortcuts', keys: '?' },
    { description: 'Switch workspace', keys: '1 – 5' },
    { description: 'Previous / next workspace', keys: '[  ]' },
    { description: 'Switch plugin in workspace', keys: 'Tab' },
    { description: 'Command palette', keys: `${mod}+K` },
  ];
}

export function groupBindings(
  bindings: KeybindingDefinition[] = keybindingRegistry.getBindings()
): [string, ShortcutEntry[]][] {
  const map = new Map<string, ShortcutEntry[]>();
  for (const b of bindings) {
    const list = map.get(b.group) ?? [];
    list.push({
      description: b.description,
      keys: sequenceToLabel(b.sequence),
    });
    map.set(b.group, list);
  }
  return Array.from(map.entries());
}

type ShortcutsReferenceProps = {
  variant?: 'full' | 'featured';
  className?: string;
  columns?: 1 | 2;
};

export function ShortcutsReference({
  variant = 'full',
  className,
  columns = 2,
}: ShortcutsReferenceProps) {
  const featured = useMemo(() => getFeaturedShortcuts(), []);
  const grouped = useMemo(() => groupBindings(), []);

  if (variant === 'featured') {
    return (
      <ul className={cn('grid gap-3 sm:grid-cols-2', className)}>
        {featured.map((item) => (
          <li
            key={item.description}
            className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-bg-surface/60 px-4 py-3"
          >
            <span className="text-[13px] text-text-secondary">{item.description}</span>
            <ShortcutKbd keys={item.keys} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-6',
        columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1',
        className
      )}
    >
      {grouped.map(([group, items]) => (
        <div key={group}>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {group}
          </h3>
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li
                key={`${group}-${i}`}
                className="flex items-center justify-between gap-3 text-[12px]"
              >
                <span className="text-text-secondary">{item.description}</span>
                <ShortcutKbd keys={item.keys} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function ShortcutKbd({ keys, className }: { keys: string; className?: string }) {
  return (
    <kbd
      className={cn(
        'shrink-0 rounded border border-border-subtle bg-bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted',
        className
      )}
    >
      {keys}
    </kbd>
  );
}

export function ShortcutsFooterHint() {
  const mod = modKeyLabel();
  return (
    <p className="text-[12px] leading-relaxed text-text-muted">
      Press <ShortcutKbd keys="?" className="inline-block align-middle" /> anytime for the full
      list. Shortcuts use <ShortcutKbd keys={mod} className="inline-block align-middle" /> on Mac
      or <ShortcutKbd keys="Ctrl" className="inline-block align-middle" /> on Windows. Customize
      in <span className="font-medium text-text-secondary">Profile → Shortcuts</span>.
    </p>
  );
}
