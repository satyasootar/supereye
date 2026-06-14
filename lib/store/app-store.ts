import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface AppState {
  activeTabs: TabId[];
  splitRatio: number; // 50 for 50/50 split
  selectedEmailId: string | null;
  currentEmailIds: string[];
  isCommandPaletteOpen: boolean;
  isComposeOpen: boolean;
  emailCategory: string;
  workspaceMode: WorkspaceMode;
  leftSidebarCollapsed: boolean;
  calendarView: 'Month' | 'Week' | 'Day' | 'Year';
  currentDateStr: string;
  isAgentOpen: boolean;
  agentMessages: AgentMessage[];
  agentSteps: AgentStep[];
  isAgentExecuting: boolean;
  openTab: (tabId: TabId, multiSelect?: boolean) => void;
  closeTab: (tabId: TabId) => void;
  setSplitRatio: (ratio: number) => void;
  setSelectedEmailId: (id: string | null) => void;
  setCurrentEmailIds: (ids: string[]) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  setComposeOpen: (isOpen: boolean) => void;
  setEmailCategory: (category: string) => void;
  setWorkspaceMode: (mode: WorkspaceMode) => void;
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
  setAgentExecuting: (executing: boolean) => void;
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
      workspaceMode: 'email',
      leftSidebarCollapsed: false,
      calendarView: 'Month',
      currentDateStr: new Date().toISOString(),
      isAgentOpen: false,
      agentMessages: [],
      agentSteps: [],
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
      setWorkspaceMode: (mode) => set({ workspaceMode: mode }),
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
      setAgentExecuting: (executing) => set({ isAgentExecuting: executing }),
      resetAgentSession: () => set({
        agentMessages: [],
        agentSteps: [],
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
        leftSidebarCollapsed: state.leftSidebarCollapsed,
        calendarView: state.calendarView,
        currentDateStr: state.currentDateStr
      }),
    }
  )
);
