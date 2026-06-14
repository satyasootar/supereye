import type { KeyStep } from '@/lib/keyboard/types';

export const SEQUENCE_TIMEOUT_MS = 1500;

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Display label for the primary modifier key on this OS. */
export function modKeyLabel(): string {
  return isMacPlatform() ? '⌘' : 'Ctrl';
}

export function normalizeKey(key: string): string {
  if (key === ' ') return 'space';
  if (key.length === 1) return key.toLowerCase();
  const map: Record<string, string> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    Escape: 'escape',
    Enter: 'enter',
    Backspace: 'backspace',
    Delete: 'delete',
    Tab: 'tab',
  };
  return map[key] ?? key.toLowerCase();
}

export function keyEventToStep(e: KeyboardEvent): KeyStep {
  return {
    key: normalizeKey(e.key),
    ctrl: e.ctrlKey || undefined,
    meta: e.metaKey || undefined,
    shift: e.shiftKey || undefined,
    alt: e.altKey || undefined,
  };
}

function stepHasMod(step: KeyStep): boolean {
  return !!(step.mod || step.ctrl || step.meta);
}

function stepExpectsMod(step: KeyStep): boolean {
  return !!(step.mod || (step.ctrl && step.meta));
}

export function stepToLabel(step: KeyStep): string {
  const parts: string[] = [];
  if (stepExpectsMod(step)) {
    parts.push(modKeyLabel());
  } else {
    if (step.ctrl) parts.push('Ctrl');
    if (step.meta) parts.push('⌘');
  }
  if (step.shift) parts.push('Shift');
  if (step.alt) parts.push('Alt');
  parts.push(
    step.key === 'space'
      ? 'Space'
      : step.key === 'tab'
        ? 'Tab'
        : step.key.length === 1
          ? step.key.toUpperCase()
          : step.key
  );
  return parts.join('+');
}

export function sequenceToLabel(sequence: KeyStep[]): string {
  return sequence.map(stepToLabel).join(' → ');
}

export function stepsMatch(a: KeyStep, b: KeyStep): boolean {
  if (a.key !== b.key) return false;
  if (!!a.shift !== !!b.shift) return false;
  if (!!a.alt !== !!b.alt) return false;

  const aMod = stepHasMod(a);
  if (stepExpectsMod(b)) {
    return aMod;
  }

  return !!a.ctrl === !!b.ctrl && !!a.meta === !!b.meta;
}

export function stepSequenceMatches(
  pressed: KeyStep[],
  expected: KeyStep[]
): boolean {
  if (pressed.length !== expected.length) return false;
  return pressed.every((step, i) => stepsMatch(step, expected[i]));
}

export function isModifierOnlyCombo(sequence: KeyStep[]): boolean {
  return sequence.every(stepHasMod);
}

/** Cross-platform modifier chord (Ctrl on Windows/Linux, ⌘ on Mac). */
export function modKey(key: string, shift = false): KeyStep {
  return {
    key,
    mod: true,
    shift: shift || undefined,
  };
}

export function parseStoredOverride(raw: string): KeyStep[] | null {
  try {
    const parsed = JSON.parse(raw) as KeyStep[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}
