import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  layoutToWorkspaceMode,
  resolveWorkspaceLayout,
  workspaceModeToLayout,
} from '@/lib/plugins/layout';
import type { PluginId } from '@/lib/plugins/types';

export type TabId = 'email';
export type WorkspaceMode = 'email' | 'calendar';

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
  | 'generic';

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
    date?: string;
    startTime?: string;
    endTime?: string;
    summary?: string;
    attendees?: string[];
    timeZone?: string;
    toolName?: string;
    message?: string;
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
  isAgentOpen: boolean;
  agentMessages: AgentMessage[];
  agentThreadId: string | null;
  agentSteps: AgentStep[];
  agentActions: AgentAction[];
  isAgentExecuting: boolean;
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
      emailCategory: 'ALL',
      emailPriorityFilter: 'all',
      workspaceMode: 'email',
      primaryPluginId: 'email',
      sidebarPluginId: 'calendar',
      activeWorkspaceId: null,
      leftSidebarCollapsed: false,
      calendarView: 'Month',
      currentDateStr: new Date().toISOString(),
      isAgentOpen: false,
      agentMessages: [],
      agentThreadId: null,
      agentSteps: [],
      agentActions: [],
      isAgentExecuting: false,
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
      addAgentAction: (action) => set((state) => ({
        agentActions: [...state.agentActions, action],
      })),
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
      setAgentThreadId: (threadId) => set({ agentThreadId: threadId }),
      startNewAgentThread: () => set({
        agentThreadId: null,
        agentMessages: [],
        agentSteps: [],
        agentActions: [],
        isAgentExecuting: false,
      }),
      resetAgentSession: () => set({
        agentMessages: [],
        agentThreadId: null,
        agentSteps: [],
        agentActions: [],
        isAgentExecuting: false,
      }),
    }),
    {
      name: 'app-storage',
      // Only persist these fields so we don't restore weird UI states like modals or selected items across sessions
      partialize: (state) => ({ 
        activeTabs: state.activeTabs, 
        splitRatio: state.splitRatio, 
        workspaceMode: state.workspaceMode,
        primaryPluginId: state.primaryPluginId,
        sidebarPluginId: state.sidebarPluginId,
        activeWorkspaceId: state.activeWorkspaceId,
        leftSidebarCollapsed: state.leftSidebarCollapsed,
        calendarView: state.calendarView,
        currentDateStr: state.currentDateStr,
        agentThreadId: state.agentThreadId,
      }),
    }
  )
);
