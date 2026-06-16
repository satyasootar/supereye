import type { KeyboardActionId } from '@/lib/keyboard/action-ids';

export type FocusMode = 'command' | 'insert' | 'modal';

export type BindingContext =
  | 'global'
  | 'workspace'
  | 'email'
  | 'calendar'
  | 'github'
  | 'modal';

/** Single step in a chord or sequence, e.g. ctrl+k or g */
export type KeyStep = {
  key: string;
  /** Cross-platform primary modifier (Ctrl / ⌘) */
  mod?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
};

export type KeybindingDefinition = {
  id: string;
  /** One or more steps — multiple steps = sequence (e.g. ['g','e']) */
  sequence: KeyStep[];
  contexts: BindingContext[];
  actionId: KeyboardActionId;
  description: string;
  /** Leader-key child (after Space leader) */
  leader?: boolean;
  /** Allow when focus mode is insert (only if all steps use ctrl/meta) */
  allowInInsert?: boolean;
  /** Shown in cheat sheet group */
  group: string;
};

export type KeybindingConflict = {
  bindingA: string;
  bindingB: string;
  context: BindingContext;
  sequence: string;
};

export type UserKeyOverrides = Record<string, KeyStep[]>;
