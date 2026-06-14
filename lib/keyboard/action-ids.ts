/** Stable action identifiers — handlers registered at runtime */
export const KEYBOARD_ACTIONS = {
  // Global
  OPEN_COMMAND_PALETTE: 'global.openCommandPalette',
  OPEN_CHEAT_SHEET: 'global.openCheatSheet',
  OPEN_GLOBAL_SEARCH: 'global.openGlobalSearch',
  FOCUS_HELP: 'global.focusHelp',
  GO_EMAIL: 'global.goEmail',
  GO_CALENDAR: 'global.goCalendar',

  // Workspace
  WORKSPACE_SWITCH: 'workspace.switch',
  WORKSPACE_CYCLE_NEXT: 'workspace.cycleNext',
  WORKSPACE_CYCLE_PREV: 'workspace.cyclePrev',
  WORKSPACE_FOCUS_PLUGIN: 'workspace.focusPlugin',
  WORKSPACE_CYCLE_PLUGIN: 'workspace.cyclePlugin',
  WORKSPACE_TOGGLE_FULLSCREEN: 'workspace.toggleFullscreen',

  // Email
  EMAIL_NEXT: 'email.next',
  EMAIL_PREV: 'email.prev',
  EMAIL_OPEN: 'email.open',
  EMAIL_ARCHIVE: 'email.archive',
  EMAIL_DELETE: 'email.delete',
  EMAIL_REPLY: 'email.reply',
  EMAIL_COMPOSE: 'email.compose',
  EMAIL_SEARCH: 'email.search',
  EMAIL_CLOSE: 'email.close',
  EMAIL_GO_INBOX: 'email.goInbox',
  EMAIL_GO_SENT: 'email.goSent',
  EMAIL_GO_DRAFTS: 'email.goDrafts',
  EMAIL_MARK_READ: 'email.markRead',
  EMAIL_MARK_UNREAD: 'email.markUnread',

  // Calendar
  CAL_CREATE: 'calendar.create',
  CAL_TODAY: 'calendar.today',
  CAL_VIEW_DAY: 'calendar.viewDay',
  CAL_VIEW_WEEK: 'calendar.viewWeek',
  CAL_VIEW_MONTH: 'calendar.viewMonth',
  CAL_PREV: 'calendar.prev',
  CAL_NEXT: 'calendar.next',
} as const;

export type KeyboardActionId =
  (typeof KEYBOARD_ACTIONS)[keyof typeof KEYBOARD_ACTIONS];
