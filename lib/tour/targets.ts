export const TOUR_TARGETS = {
  workspaceSwitcher: 'workspace-switcher',
  pluginSwitch: 'plugin-switch',
  pluginNav: 'plugin-nav',
  mainPanel: 'main-panel',
  secondaryPanel: 'secondary-panel',
  brief: 'brief',
  eye: 'eye',
  notifications: 'notifications',
  profile: 'profile',
} as const;

export type TourTargetId = (typeof TOUR_TARGETS)[keyof typeof TOUR_TARGETS];
