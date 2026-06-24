import { create } from 'zustand';

interface AppSettingsState {
  reducedMotion: boolean;
  lowBatteryMode: boolean;
  nightMode: boolean;
  
  toggleReducedMotion: () => void;
  toggleLowBatteryMode: () => void;
  toggleNightMode: () => void;
}

export const useAppSettingsStore = create<AppSettingsState>((set) => ({
  reducedMotion: false,
  lowBatteryMode: false,
  nightMode: false,

  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
  toggleLowBatteryMode: () => set((state) => ({ lowBatteryMode: !state.lowBatteryMode })),
  toggleNightMode: () => set((state) => ({ nightMode: !state.nightMode })),
}));
