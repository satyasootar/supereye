import { create } from 'zustand';
import { MAX_PLUGINS_PER_WORKSPACE } from '@/lib/plugins/registry';

type TourStore = {
  isActive: boolean;
  stepIndex: number;
  startTour: () => void;
  nextStep: (maxIndex: number) => void;
  prevStep: () => void;
  skipTour: () => void;
  endTour: () => void;
};

export const useTourStore = create<TourStore>((set) => ({
  isActive: false,
  stepIndex: 0,
  startTour: () => set({ isActive: true, stepIndex: 0 }),
  nextStep: (maxIndex) =>
    set((state) => ({
      stepIndex: Math.min(state.stepIndex + 1, maxIndex),
    })),
  prevStep: () =>
    set((state) => ({
      stepIndex: Math.max(state.stepIndex - 1, 0),
    })),
  skipTour: () => set({ isActive: false, stepIndex: 0 }),
  endTour: () => set({ isActive: false, stepIndex: 0 }),
}));

export async function persistTourCompleted(): Promise<void> {
  await fetch('/api/user/preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      botSettings: { workspaceTourCompleted: true },
    }),
  });
}

export { MAX_PLUGINS_PER_WORKSPACE };
