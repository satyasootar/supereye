import type { KeybindingDefinition } from '@/lib/keyboard/types';
import { KEYBOARD_ACTIONS } from '@/lib/keyboard/action-ids';
import { modKey } from '@/lib/keyboard/key-parser';

/**
 * Essential shortcuts only — easy to learn, cross-platform (Ctrl on Windows, ⌘ on Mac).
 */
export const DEFAULT_KEYBINDINGS: KeybindingDefinition[] = [
  // ─── Essentials ───────────────────────────────────────────
  {
    id: 'global.cheatSheet',
    sequence: [{ key: '?' }],
    contexts: ['global', 'workspace', 'email', 'calendar'],
    actionId: KEYBOARD_ACTIONS.OPEN_CHEAT_SHEET,
    description: 'Show shortcuts',
    group: 'Essentials',
  },
  {
    id: 'global.commandPalette',
    sequence: [modKey('k')],
    contexts: ['global', 'workspace', 'email', 'calendar'],
    actionId: KEYBOARD_ACTIONS.OPEN_COMMAND_PALETTE,
    description: 'Command palette',
    group: 'Essentials',
    allowInInsert: true,
  },

  // ─── Workspaces ─────────────────────────────────────────
  {
    id: 'workspace.switch.1',
    sequence: [{ key: '1' }],
    contexts: ['workspace', 'email', 'calendar'],
    actionId: KEYBOARD_ACTIONS.WORKSPACE_SWITCH,
    description: 'Go to workspace 1',
    group: 'Workspaces',
  },
  {
    id: 'workspace.switch.2',
    sequence: [{ key: '2' }],
    contexts: ['workspace', 'email', 'calendar'],
    actionId: KEYBOARD_ACTIONS.WORKSPACE_SWITCH,
    description: 'Go to workspace 2',
    group: 'Workspaces',
  },
  {
    id: 'workspace.switch.3',
    sequence: [{ key: '3' }],
    contexts: ['workspace', 'email', 'calendar'],
    actionId: KEYBOARD_ACTIONS.WORKSPACE_SWITCH,
    description: 'Go to workspace 3',
    group: 'Workspaces',
  },
  {
    id: 'workspace.switch.4',
    sequence: [{ key: '4' }],
    contexts: ['workspace', 'email', 'calendar'],
    actionId: KEYBOARD_ACTIONS.WORKSPACE_SWITCH,
    description: 'Go to workspace 4',
    group: 'Workspaces',
  },
  {
    id: 'workspace.switch.5',
    sequence: [{ key: '5' }],
    contexts: ['workspace', 'email', 'calendar'],
    actionId: KEYBOARD_ACTIONS.WORKSPACE_SWITCH,
    description: 'Go to workspace 5',
    group: 'Workspaces',
  },
  {
    id: 'workspace.cyclePrev',
    sequence: [{ key: '[' }],
    contexts: ['workspace', 'email', 'calendar'],
    actionId: KEYBOARD_ACTIONS.WORKSPACE_CYCLE_PREV,
    description: 'Previous workspace',
    group: 'Workspaces',
  },
  {
    id: 'workspace.cycleNext',
    sequence: [{ key: ']' }],
    contexts: ['workspace', 'email', 'calendar'],
    actionId: KEYBOARD_ACTIONS.WORKSPACE_CYCLE_NEXT,
    description: 'Next workspace',
    group: 'Workspaces',
  },
  {
    id: 'workspace.cyclePlugin',
    sequence: [{ key: 'tab' }],
    contexts: ['workspace', 'email', 'calendar'],
    actionId: KEYBOARD_ACTIONS.WORKSPACE_CYCLE_PLUGIN,
    description: 'Switch plugin in workspace',
    group: 'Workspaces',
  },



  // ─── AI Assistant ───────────────────────────────────────
  {
    id: 'agent.toggle',
    sequence: [modKey('j')],
    contexts: ['global', 'workspace', 'email', 'calendar', 'modal'],
    actionId: KEYBOARD_ACTIONS.AGENT_TOGGLE,
    description: 'Toggle AI assistant',
    group: 'AI Assistant',
    allowInInsert: true,
  },
  {
    id: 'agent.newChat',
    sequence: [modKey('j', true)],
    contexts: ['global', 'workspace', 'email', 'calendar', 'modal'],
    actionId: KEYBOARD_ACTIONS.AGENT_NEW_CHAT,
    description: 'New AI chat',
    group: 'AI Assistant',
    allowInInsert: true,
  },
];
