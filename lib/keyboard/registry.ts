import type {
  BindingContext,
  KeybindingConflict,
  KeybindingDefinition,
  KeyStep,
  UserKeyOverrides,
} from '@/lib/keyboard/types';
import {
  sequenceToLabel,
  stepSequenceMatches,
  stepsMatch,
} from '@/lib/keyboard/key-parser';

export type ResolvedBinding = KeybindingDefinition & {
  sequence: KeyStep[];
};

function contextKey(ctx: BindingContext, sequence: KeyStep[]): string {
  return `${ctx}::${sequence.map((s) => JSON.stringify(s)).join('>')}`;
}

export class KeybindingRegistry {
  private bindings = new Map<string, ResolvedBinding>();
  private overrides: UserKeyOverrides = {};
  private conflicts: KeybindingConflict[] = [];

  register(definitions: KeybindingDefinition[]) {
    for (const def of definitions) {
      this.bindings.set(def.id, { ...def, sequence: [...def.sequence] });
    }
    this.rebuildConflicts();
  }

  setOverrides(overrides: UserKeyOverrides) {
    this.overrides = overrides;
    this.rebuildConflicts();
  }

  remap(bindingId: string, sequence: KeyStep[]) {
    this.overrides[bindingId] = sequence;
    this.rebuildConflicts();
  }

  clearRemap(bindingId: string) {
    delete this.overrides[bindingId];
    this.rebuildConflicts();
  }

  getBindings(): ResolvedBinding[] {
    return Array.from(this.bindings.values()).map((b) => ({
      ...b,
      sequence: this.overrides[b.id] ?? b.sequence,
    }));
  }

  getBinding(id: string): ResolvedBinding | undefined {
    const base = this.bindings.get(id);
    if (!base) return undefined;
    return {
      ...base,
      sequence: this.overrides[id] ?? base.sequence,
    };
  }

  getConflicts(): KeybindingConflict[] {
    return this.conflicts;
  }

  findMatch(
    pressed: KeyStep[],
    activeContexts: BindingContext[],
    options: { leaderActive: boolean; focusMode: 'command' | 'insert' | 'modal' }
  ): ResolvedBinding | null {
    const candidates = this.getBindings().filter((b) => {
      if (!b.contexts.some((c) => activeContexts.includes(c))) return false;
      if (b.leader && !options.leaderActive) return false;
      if (!b.leader && options.leaderActive && b.contexts.includes('global')) {
        if (b.sequence.length === 1 && !b.sequence[0].mod && !b.sequence[0].ctrl && !b.sequence[0].meta) {
          return false;
        }
      }
      if (options.focusMode === 'insert' && !b.allowInInsert) {
        if (!b.sequence.every((s) => s.mod || s.ctrl || s.meta)) return false;
      }
      return stepSequenceMatches(pressed, b.sequence);
    });

    if (candidates.length === 0) return null;
    // Prefer more specific context: email/calendar > workspace > global
    const order: BindingContext[] = [
      'modal',
      'email',
      'calendar',
      'workspace',
      'global',
    ];
    candidates.sort(
      (a, b) =>
        Math.max(...b.contexts.map((c) => -order.indexOf(c))) -
        Math.max(...a.contexts.map((c) => -order.indexOf(c)))
    );
    return candidates[0];
  }

  findPrefixMatches(
    pressed: KeyStep[],
    activeContexts: BindingContext[],
    leaderActive: boolean
  ): ResolvedBinding[] {
    return this.getBindings().filter((b) => {
      if (!b.contexts.some((c) => activeContexts.includes(c))) return false;
      if (b.leader && !leaderActive) return false;
      if (pressed.length >= b.sequence.length) return false;
      return b.sequence
        .slice(0, pressed.length)
        .every((step, i) => stepsMatch(step, pressed[i]));
    });
  }

  private rebuildConflicts() {
    const seen = new Map<string, string>();
    this.conflicts = [];

    for (const binding of this.getBindings()) {
      for (const ctx of binding.contexts) {
        const key = contextKey(ctx, binding.sequence);
        const label = sequenceToLabel(binding.sequence);
        const existing = seen.get(key);
        if (existing) {
          this.conflicts.push({
            bindingA: existing,
            bindingB: binding.id,
            context: ctx,
            sequence: label,
          });
        } else {
          seen.set(key, binding.id);
        }
      }
    }
  }
}

export const keybindingRegistry = new KeybindingRegistry();
