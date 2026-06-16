'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BindingContext,
  FocusMode,
  KeyStep,
  UserKeyOverrides,
} from '@/lib/keyboard/types';
import {
  fetchUserKeybindings,
  saveUserKeybindings,
} from '@/lib/keyboard/sync-client';

const OVERRIDES_KEY = 'supereye-keyboard-overrides';
let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function loadOverrides(): UserKeyOverrides {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as UserKeyOverrides) : {};
  } catch {
    return {};
  }
}

export function saveOverrides(overrides: UserKeyOverrides) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
}

function scheduleServerSync(overrides: UserKeyOverrides) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void saveUserKeybindings(overrides).catch(() => {
      /* offline — local cache remains */
    });
  }, 600);
}

type KeyboardStore = {
  focusMode: FocusMode;
  activePanel: BindingContext;
  modalDepth: number;
  leaderActive: boolean;
  sequenceBuffer: KeyStep[];
  sequenceLabel: string | null;
  isCheatSheetOpen: boolean;
  overrides: UserKeyOverrides;
  overridesSynced: boolean;
  keybindingsEnabled: boolean;

  setFocusMode: (mode: FocusMode) => void;
  setActivePanel: (panel: BindingContext) => void;
  pushModal: () => void;
  popModal: () => void;
  setLeaderActive: (active: boolean) => void;
  setSequenceBuffer: (buffer: KeyStep[], label: string | null) => void;
  clearSequence: () => void;
  setCheatSheetOpen: (open: boolean) => void;
  setOverride: (bindingId: string, sequence: KeyStep[]) => void;
  removeOverride: (bindingId: string) => void;
  setOverrides: (overrides: UserKeyOverrides) => void;
  loadStoredOverrides: () => void;
  hydrateOverridesFromServer: () => Promise<void>;
  setKeybindingsEnabled: (enabled: boolean) => void;
  hydrateKeybindingsPreferenceFromServer: () => Promise<void>;
};

export const useKeyboardStore = create<KeyboardStore>()(
  persist(
    (set, get) => ({
      focusMode: 'command',
      activePanel: 'workspace',
      modalDepth: 0,
      leaderActive: false,
      sequenceBuffer: [],
      sequenceLabel: null,
      isCheatSheetOpen: false,
      overrides: {},
      overridesSynced: false,
      keybindingsEnabled: true,

      setFocusMode: (mode) => set({ focusMode: mode }),
      setActivePanel: (panel) => set({ activePanel: panel }),
      pushModal: () => set({ modalDepth: get().modalDepth + 1, focusMode: 'modal' }),
      popModal: () => {
        const next = Math.max(0, get().modalDepth - 1);
        set({
          modalDepth: next,
          focusMode: next > 0 ? 'modal' : 'command',
        });
      },
      setLeaderActive: (active) => set({ leaderActive: active }),
      setSequenceBuffer: (buffer, label) =>
        set({ sequenceBuffer: buffer, sequenceLabel: label }),
      clearSequence: () =>
        set({ sequenceBuffer: [], sequenceLabel: null, leaderActive: false }),
      setCheatSheetOpen: (open) => set({ isCheatSheetOpen: open }),

      setOverrides: (overrides) => {
        saveOverrides(overrides);
        set({ overrides, overridesSynced: true });
      },

      setOverride: (bindingId, sequence) => {
        const overrides = { ...get().overrides, [bindingId]: sequence };
        saveOverrides(overrides);
        set({ overrides });
        scheduleServerSync(overrides);
      },

      removeOverride: (bindingId) => {
        const overrides = { ...get().overrides };
        delete overrides[bindingId];
        saveOverrides(overrides);
        set({ overrides });
        scheduleServerSync(overrides);
      },

      loadStoredOverrides: () => set({ overrides: loadOverrides() }),

      hydrateOverridesFromServer: async () => {
        try {
          const server = await fetchUserKeybindings();
          const local = loadOverrides();
          const serverCount = Object.keys(server).length;
          const localCount = Object.keys(local).length;

          if (serverCount > 0) {
            saveOverrides(server);
            set({ overrides: server, overridesSynced: true });
            return;
          }

          if (localCount > 0) {
            const saved = await saveUserKeybindings(local);
            saveOverrides(saved);
            set({ overrides: saved, overridesSynced: true });
            return;
          }

          set({ overrides: {}, overridesSynced: true });
        } catch {
          set({ overrides: loadOverrides(), overridesSynced: false });
        }
      },

      setKeybindingsEnabled: (enabled) => set({ keybindingsEnabled: enabled }),

      hydrateKeybindingsPreferenceFromServer: async () => {
        try {
          const res = await fetch('/api/user/preferences');
          if (!res.ok) return;
          const data = await res.json();
          if (typeof data.keybindingsEnabled === 'boolean') {
            set({ keybindingsEnabled: data.keybindingsEnabled });
          }
        } catch {
          /* keep default enabled */
        }
      },
    }),
    {
      name: 'supereye-keyboard-ui',
      partialize: (s) => ({
        overrides: s.overrides,
        keybindingsEnabled: s.keybindingsEnabled,
      }),
    }
  )
);
