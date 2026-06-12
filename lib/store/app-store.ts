import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TabId = 'chat' | 'email' | 'calendar';

interface AppState {
  activeTabs: TabId[];
  splitRatio: number; // 50 for 50/50 split
  selectedEmailId: string | null;
  currentEmailIds: string[];
  isCommandPaletteOpen: boolean;
  openTab: (tabId: TabId, multiSelect?: boolean) => void;
  closeTab: (tabId: TabId) => void;
  setSplitRatio: (ratio: number) => void;
  setSelectedEmailId: (id: string | null) => void;
  setCurrentEmailIds: (ids: string[]) => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTabs: ['chat'], // Default tab
      splitRatio: 50,
      selectedEmailId: null,
      currentEmailIds: [],
      isCommandPaletteOpen: false,
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
    }),
    {
      name: 'app-storage',
      // Only persist these fields so we don't restore weird UI states like modals or selected items across sessions
      partialize: (state) => ({ activeTabs: state.activeTabs, splitRatio: state.splitRatio }),
    }
  )
);
