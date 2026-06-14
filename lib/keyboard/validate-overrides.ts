import type { KeyStep, UserKeyOverrides } from '@/lib/keyboard/types';
import { DEFAULT_KEYBINDINGS } from '@/lib/keyboard/default-bindings';

const VALID_BINDING_IDS = new Set(DEFAULT_KEYBINDINGS.map((b) => b.id));
const MAX_SEQUENCE_LENGTH = 6;

function isKeyStep(value: unknown): value is KeyStep {
  if (!value || typeof value !== 'object') return false;
  const step = value as KeyStep;
  if (typeof step.key !== 'string' || step.key.length === 0) return false;
  if (step.mod !== undefined && typeof step.mod !== 'boolean') return false;
  if (step.ctrl !== undefined && typeof step.ctrl !== 'boolean') return false;
  if (step.meta !== undefined && typeof step.meta !== 'boolean') return false;
  if (step.shift !== undefined && typeof step.shift !== 'boolean') return false;
  if (step.alt !== undefined && typeof step.alt !== 'boolean') return false;
  return true;
}

/** Sanitize and validate user keybinding overrides from API / DB. */
export function parseUserKeyOverrides(raw: unknown): UserKeyOverrides {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  const result: UserKeyOverrides = {};

  for (const [bindingId, sequence] of Object.entries(raw as Record<string, unknown>)) {
    if (!VALID_BINDING_IDS.has(bindingId)) continue;
    if (!Array.isArray(sequence)) continue;
    if (sequence.length === 0 || sequence.length > MAX_SEQUENCE_LENGTH) continue;
    if (!sequence.every(isKeyStep)) continue;
    result[bindingId] = sequence.map((s) => ({
      key: s.key.toLowerCase(),
      mod: s.mod || undefined,
      ctrl: s.ctrl || undefined,
      meta: s.meta || undefined,
      shift: s.shift || undefined,
      alt: s.alt || undefined,
    }));
  }

  return result;
}

export function getValidBindingIds(): string[] {
  return Array.from(VALID_BINDING_IDS);
}
