import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  layoutToWorkspaceMode,
  resolveWorkspaceLayout,
  workspaceModeToLayout,
} from '@/lib/plugins/layout';
import type { PluginId } from '@/lib/plugins/types';

export type TabId = 'email';
export type WorkspaceMode = 'email' | 'calendar' | 'github' | 'drive';
export type GithubView = 'pulls' | 'issues';
export type GithubSection = 'overview' | 'inbox' | 'repo';
export type GithubRepoTab = 'pulls' | 'issues' | 'commits' | 'releases' | 'actions';
export type GithubInboxFilter = 'all' | 'pulls' | 'issues';
export type DriveSection = 'recent' | 'browse';

export type AgentMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
};

export type AgentStep = {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
};

export type AgentActionType =
  | 'analyzing'
  | 'email_draft'
  | 'email_send'
  | 'calendar_schedule'
  | 'github_action'
  | 'drive_action'
  | 'generic';

export type AgentCalendarIntent = {
  summary: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
  addGoogleMeet?: boolean;
  timeZone?: string;
  description?: string;
};

export type AgentPendingEmailReview = {
  actionId: string;
  groupId: string;
  to: string[];
  subject: string;
  body: string;
  calendarIntent?: AgentCalendarIntent;
};

export type AgentAction = {
  id: string;
  type: AgentActionType;
  status: 'running' | 'done' | 'error';
  title: string;
  groupId?: string;
  payload?: {
    to?: string | string[];
    subject?: string;
    body?: string;
    phase?: string;
    calendarIntent?: AgentCalendarIntent;
    date?: string;
    startTime?: string;
    endTime?: string;
    summary?: string;
    attendees?: string[];
    timeZone?: string;
    toolName?: string;
    message?: string;
    // GitHub fields
    repoName?: string;
    branch?: string;
    prNumber?: number;
    issueNumber?: number;
    commitMessage?: string;
    prTitle?: string;
    issueTitle?: string;
    prStatus?: 'open' | 'closed' | 'merged';
    issueStatus?: 'open' | 'closed';
    // Drive fields
    fileName?: string;
    fileType?: string;
    folderId?: string;
    folderName?: string;
    driveAction?: 'upload' | 'create' | 'share' | 'browse';
    files?: Array<{ name: string; type: string; size?: number; url?: string }>;
    webViewLink?: string;
    progress?: number;
  };
};

interface AppState {
  activeTabs: TabId[];
  splitRatio: number; // 50 for 50/50 split
  selectedEmailId: string | null;
  currentEmailIds: string[];
  isCommandPaletteOpen: boolean;
  isComposeOpen: boolean;
  emailCategory: string;
  emailPriorityFilter: 'all' | 'urgent' | 'can_wait';
  workspaceMode: WorkspaceMode;
  primaryPluginId: PluginId;
  sidebarPluginId: PluginId | null;
  activeWorkspaceId: string | null;
  leftSidebarCollapsed: boolean;
  calendarView: 'Month' | 'Week' | 'Day' | 'Year';
  currentDateStr: string;
  githubView: GithubView;
  githubSection: GithubSection;
  githubRepoTab: GithubRepoTab;
  githubInboxFilter: GithubInboxFilter;
  selectedGithubRepo: string | null;
  selectedGithubItemKey: string | null;
  driveSection: DriveSection;
  selectedDriveFolderId: string | null;
  selectedDriveFileId: string | null;
  isAgentOpen: boolean;
  agentMessages: AgentMessage[];
  agentThreadId: string | null;
  agentSteps: AgentStep[];
  agentActions: AgentAction[];
  isAgentExecuting: boolean;
  agentInteractiveMode: boolean;
  agentPendingReview: AgentPendingEmailReview | null;
  openTab: (tabId: TabId, multiSelect?: boolean) => void;
  closeTab: (tabId: TabId) => void;
  setSplitRatio: (ratio: number) => void;
  setSelectedEmailId: (id: string | null) => void;
  setCurrentEmailIds: (ids: string[]) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setComposeOpen: (isOpen: boolean) => void;
  setEmailCategory: (category: string) => void;
  setEmailPriorityFilter: (filter: 'all' | 'urgent' | 'can_wait') => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
  setLayoutMode: (primary: PluginId, sidebar?: PluginId | null) => void;
  syncLayoutWithPlugins: (activePlugins: PluginId[]) => void;
  applyServerLayout: (
    layout: { primary: PluginId; sidebar: PluginId | null },
    activePlugins: PluginId[]
  ) => void;
  applyWorkspaceLayout: (
    layout: { primary: PluginId; sidebar: PluginId | null },
    workspacePlugins: PluginId[]
  ) => void;
  setActiveWorkspaceId: (id: string | null) => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setCalendarView: (view: 'Month' | 'Week' | 'Day' | 'Year') => void;
  setCurrentDateStr: (dateStr: string) => void;
  setGithubView: (view: GithubView) => void;
  setGithubSection: (section: GithubSection) => void;
  setGithubRepoTab: (tab: GithubRepoTab) => void;
  setGithubInboxFilter: (filter: GithubInboxFilter) => void;
  setSelectedGithubRepo: (repo: string | null) => void;
  setSelectedGithubItemKey: (key: string | null) => void;
  openGithubRepo: (repoFullName: string, tab?: GithubRepoTab) => void;
  openGithubItem: (params: {
    repoFullName: string;
    kind: 'pull' | 'issue';
    number: number;
  }) => void;
  focusGithubInboxItem: (params: {
    repoFullName: string;
    kind: 'pull' | 'issue';
    number: number;
  }) => void;
  setDriveSection: (section: DriveSection) => void;
  setSelectedDriveFolderId: (folderId: string | null) => void;
  setSelectedDriveFileId: (fileId: string | null) => void;
  openDriveFolder: (folderId: string) => void;
  openDriveFile: (fileId: string) => void;
  setAgentOpen: (open: boolean) => void;
  addAgentMessage: (msg: AgentMessage) => void;
  setAgentMessages: (messages: AgentMessage[]) => void;
  updateAgentMessage: (id: string, patch: Partial<AgentMessage>) => void;
  appendAgentMessageContent: (id: string, delta: string) => void;
  setAgentSteps: (steps: AgentStep[]) => void;
  updateAgentStep: (id: string, patch: Partial<AgentStep>) => void;
  setAgentActions: (actions: AgentAction[]) => void;
  addAgentAction: (action: AgentAction) => void;
  updateAgentAction: (id: string, patch: Partial<AgentAction>) => void;
  setAgentExecuting: (executing: boolean) => void;
  setAgentInteractiveMode: (enabled: boolean) => void;
  setAgentPendingReview: (review: AgentPendingEmailReview | null) => void;
  updateAgentPendingReview: (patch: Partial<AgentPendingEmailReview>) => void;
  setAgentThreadId: (threadId: string | null) => void;
  startNewAgentThread: () => void;
  resetAgentSession: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTabs: ['email'], // Default tab
      splitRatio: 50,
      selectedEmailId: null,
      currentEmailIds: [],
      isCommandPaletteOpen: false,
      isComposeOpen: false,
      emailCategory: 'INBOX',
      emailPriorityFilter: 'all',
      workspaceMode: 'email',
      primaryPluginId: 'email',
      sidebarPluginId: 'calendar',
      activeWorkspaceId: null,
      leftSidebarCollapsed: false,
      calendarView: 'Month',
      currentDateStr: new Date().toISOString(),
      githubView: 'pulls',
      githubSection: 'overview',
      githubRepoTab: 'pulls',
      githubInboxFilter: 'all',
      selectedGithubRepo: null,
      selectedGithubItemKey: null,
      driveSection: 'recent',
      selectedDriveFolderId: null,
      selectedDriveFileId: null,
      isAgentOpen: false,
      agentMessages: [],
      agentThreadId: null,
      agentSteps: [],
      agentActions: [],
      isAgentExecuting: false,
      agentInteractiveMode: false,
      agentPendingReview: null,
      openTab: (tabId, multiSelect = false) => set((state) => {
        if (multiSelect) {
          // Cannot have more than 2 tabs open
          if (state.activeTabs.length >= 2 && !state.activeTabs.includes(tabId)) {
            return { activeTabs: [state.activeTabs[1], tabId] };
          }
          return { 
            activeTabs: Array.from(new Set([...state.activeTabs, tabId]))
          };
        }
        // If not multi-select, just replace the active tab, unless the tab is already active and we are trying to collapse a split
        if (!multiSelect && state.activeTabs.length > 1 && state.activeTabs.includes(tabId)) {
           return { activeTabs: [tabId] };
        }
        return { activeTabs: [tabId] };
      }),
      closeTab: (tabId) => set((state) => ({
        activeTabs: state.activeTabs.filter(id => id !== tabId)
      })),
      setSplitRatio: (ratio) => set({ splitRatio: ratio }),
      setSelectedEmailId: (id) => set({ selectedEmailId: id }),
      setCurrentEmailIds: (ids) => set({ currentEmailIds: ids }),
      setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
      setComposeOpen: (isOpen) => set({ isComposeOpen: isOpen }),
      setEmailCategory: (category) => set({ emailCategory: category }),
      setEmailPriorityFilter: (filter) => set({ emailPriorityFilter: filter }),
      setWorkspaceMode: (mode) =>
        set((state) => {
          const layout = workspaceModeToLayout(mode, [
            'email',
            'calendar',
          ] as PluginId[]);
          return {
            workspaceMode: mode,
            primaryPluginId: layout.primary,
            sidebarPluginId: layout.sidebar,
          };
        }),
      setLayoutMode: (primary, sidebar) =>
        set((state) => ({
          primaryPluginId: primary,
          sidebarPluginId:
            sidebar !== undefined
              ? sidebar
              : state.sidebarPluginId === primary
                ? null
                : state.sidebarPluginId,
          workspaceMode: layoutToWorkspaceMode(primary),
        })),
      syncLayoutWithPlugins: (activePlugins) =>
        set((state) => {
          const layout = resolveWorkspaceLayout(activePlugins, {
            primaryPluginId: state.primaryPluginId,
            sidebarPluginId: state.sidebarPluginId,
          });
          return {
            primaryPluginId: layout.primary,
            sidebarPluginId: layout.sidebar,
            workspaceMode: layoutToWorkspaceMode(layout.primary),
          };
        }),
      applyServerLayout: (layout, activePlugins) =>
        set((state) => {
          const resolved = resolveWorkspaceLayout(activePlugins, {
            primaryPluginId: layout.primary,
            sidebarPluginId: layout.sidebar,
          });
          if (
            state.primaryPluginId === resolved.primary &&
            state.sidebarPluginId === resolved.sidebar
          ) {
            return state;
          }
          return {
            primaryPluginId: resolved.primary,
            sidebarPluginId: resolved.sidebar,
            workspaceMode: layoutToWorkspaceMode(resolved.primary),
          };
        }),
      applyWorkspaceLayout: (layout, workspacePlugins) =>
        set(() => {
          const resolved = resolveWorkspaceLayout(workspacePlugins, {
            primaryPluginId: layout.primary,
            sidebarPluginId: layout.sidebar,
          });
          return {
            primaryPluginId: resolved.primary,
            sidebarPluginId: resolved.sidebar,
            workspaceMode: layoutToWorkspaceMode(resolved.primary),
          };
        }),
      setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
      setLeftSidebarCollapsed: (collapsed) => set({ leftSidebarCollapsed: collapsed }),
      setCalendarView: (view) => set({ calendarView: view }),
      setCurrentDateStr: (dateStr) => set({ currentDateStr: dateStr }),
      setGithubView: (view) =>
        set({
          githubView: view,
          githubRepoTab: view,
          selectedGithubItemKey: null,
        }),
      setGithubSection: (section) =>
        set({ githubSection: section, selectedGithubItemKey: null }),
      setGithubRepoTab: (tab) =>
        set((state) => ({
          githubRepoTab: tab,
          ...(tab === 'pulls' || tab === 'issues' ? { githubView: tab } : {}),
          selectedGithubItemKey: null,
        })),
      setGithubInboxFilter: (filter) =>
        set({ githubInboxFilter: filter, selectedGithubItemKey: null }),
      setSelectedGithubRepo: (repo) =>
        set((state) => ({
          selectedGithubRepo: repo,
          ...(repo ? { githubSection: 'repo' as const } : {}),
          selectedGithubItemKey: null,
        })),
      setSelectedGithubItemKey: (key) => set({ selectedGithubItemKey: key }),
      openGithubRepo: (repoFullName, tab = 'pulls') =>
        set({
          githubSection: 'repo',
          selectedGithubRepo: repoFullName,
          githubRepoTab: tab,
          githubView: tab === 'pulls' || tab === 'issues' ? tab : 'pulls',
          selectedGithubItemKey: null,
        }),
      openGithubItem: ({ repoFullName, kind, number }) => {
        const [owner, repo] = repoFullName.split('/');
        const tab = kind === 'pull' ? 'pulls' : 'issues';
        const key = `${tab}:${owner}/${repo}:${number}`;
        set({
          githubSection: 'repo',
          selectedGithubRepo: repoFullName,
          githubRepoTab: tab,
          githubView: tab,
          selectedGithubItemKey: key,
        });
      },
      focusGithubInboxItem: ({ repoFullName, kind, number }) => {
        const [owner, repo] = repoFullName.split('/');
        const tab = kind === 'pull' ? 'pulls' : 'issues';
        const key = `${tab}:${owner}/${repo}:${number}`;
        set({
          githubSection: 'inbox',
          githubInboxFilter: kind === 'pull' ? 'pulls' : 'issues',
          selectedGithubItemKey: key,
        });
      },
      setDriveSection: (section) =>
        set({ driveSection: section, selectedDriveFileId: null }),
      setSelectedDriveFolderId: (folderId) => set({ selectedDriveFolderId: folderId }),
      setSelectedDriveFileId: (fileId) => set({ selectedDriveFileId: fileId }),
      openDriveFolder: (folderId) =>
        set({
          driveSection: 'browse',
          selectedDriveFolderId: folderId,
          selectedDriveFileId: null,
        }),
      openDriveFile: (fileId) =>
        set({
          driveSection: 'browse',
          selectedDriveFileId: fileId,
        }),
      setAgentOpen: (open) => set({ isAgentOpen: open }),
      addAgentMessage: (msg) => set((state) => ({
        agentMessages: [...state.agentMessages, msg],
      })),
      setAgentMessages: (messages) => set({ agentMessages: messages }),
      updateAgentMessage: (id, patch) => set((state) => ({
        agentMessages: state.agentMessages.map((m) =>
          m.id === id ? { ...m, ...patch } : m
        ),
      })),
      appendAgentMessageContent: (id, delta) => set((state) => ({
        agentMessages: state.agentMessages.map((m) =>
          m.id === id ? { ...m, content: m.content + delta } : m
        ),
      })),
      setAgentSteps: (steps) => set({ agentSteps: steps }),
      updateAgentStep: (id, patch) => set((state) => ({
        agentSteps: state.agentSteps.map((s) =>
          s.id === id ? { ...s, ...patch } : s
        ),
      })),
      setAgentActions: (actions) => set({ agentActions: actions }),
      addAgentAction: (action) => set((state) => {
        const existing = state.agentActions.findIndex((a) => a.id === action.id);
        if (existing >= 0) {
          const agentActions = [...state.agentActions];
          agentActions[existing] = action;
          return { agentActions };
        }
        return { agentActions: [...state.agentActions, action] };
      }),
      updateAgentAction: (id, patch) => set((state) => ({
        agentActions: state.agentActions.map((a) =>
          a.id === id
            ? {
                ...a,
                ...patch,
                payload: patch.payload
                  ? { ...a.payload, ...patch.payload }
                  : a.payload,
              }
            : a
        ),
      })),
      setAgentExecuting: (executing) => set({ isAgentExecuting: executing }),
      setAgentInteractiveMode: (enabled) => set({ agentInteractiveMode: enabled }),
      setAgentPendingReview: (review) => set({ agentPendingReview: review }),
      updateAgentPendingReview: (patch) => set((state) => ({
        agentPendingReview: state.agentPendingReview
          ? { ...state.agentPendingReview, ...patch }
          : null,
      })),
      setAgentThreadId: (threadId) => set({ agentThreadId: threadId }),
      startNewAgentThread: () => set({
        agentThreadId: null,
        agentMessages: [],
        agentSteps: [],
        agentActions: [],
        isAgentExecuting: false,
        agentPendingReview: null,
      }),
      resetAgentSession: () => set({
        agentMessages: [],
        agentThreadId: null,
        agentSteps: [],
        agentActions: [],
        isAgentExecuting: false,
        agentPendingReview: null,
      }),
    }),
    {
      name: 'app-storage',
      // Only persist these fields so we don't restore weird UI states like modals or selected items across sessions
      partialize: (state) => ({ 
        activeTabs: state.activeTabs, 
        splitRatio: state.splitRatio, 
        emailCategory: state.emailCategory,
        workspaceMode: state.workspaceMode,
        primaryPluginId: state.primaryPluginId,
        sidebarPluginId: state.sidebarPluginId,
        activeWorkspaceId: state.activeWorkspaceId,
        leftSidebarCollapsed: state.leftSidebarCollapsed,
        calendarView: state.calendarView,
        currentDateStr: state.currentDateStr,
        githubView: state.githubView,
        githubSection: state.githubSection,
        githubRepoTab: state.githubRepoTab,
        githubInboxFilter: state.githubInboxFilter,
        selectedGithubRepo: state.selectedGithubRepo,
        driveSection: state.driveSection,
        selectedDriveFolderId: state.selectedDriveFolderId,
        agentThreadId: state.agentThreadId,
        agentInteractiveMode: state.agentInteractiveMode,
      }),
    }
  )
);
