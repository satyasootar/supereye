/** Stable action identifiers — handlers registered at runtime */
export const KEYBOARD_ACTIONS = {
  // Global
  OPEN_COMMAND_PALETTE: 'global.openCommandPalette',
  OPEN_CHEAT_SHEET: 'global.openCheatSheet',
  OPEN_GLOBAL_SEARCH: 'global.openGlobalSearch',
  FOCUS_HELP: 'global.focusHelp',
  GO_EMAIL: 'global.goEmail',
  GO_CALENDAR: 'global.goCalendar',
  OPEN_COMPOSE: 'global.openCompose',

  // Workspace
  WORKSPACE_SWITCH: 'workspace.switch',
  WORKSPACE_CYCLE_NEXT: 'workspace.cycleNext',
  WORKSPACE_CYCLE_PREV: 'workspace.cyclePrev',
  WORKSPACE_CYCLE_PLUGIN: 'workspace.cyclePlugin',
  WORKSPACE_TOGGLE_FULLSCREEN: 'workspace.toggleFullscreen',

  // Agent
  AGENT_TOGGLE: 'agent.toggle',
  AGENT_NEW_CHAT: 'agent.newChat',
} as const;

export type KeyboardActionId =
  (typeof KEYBOARD_ACTIONS)[keyof typeof KEYBOARD_ACTIONS];
