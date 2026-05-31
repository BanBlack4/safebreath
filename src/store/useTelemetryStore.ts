/**
 * SafeBreath MVP - Telemetry Zustand Buffer
 * Optimizes updates and syncs with offline buffer.
 */

import { create } from 'zustand';

export interface TelemetryPoint {
  bpm: number;
  hrv: number;
  timestamp: number;
  confidence: number;
}

interface TelemetryState {
  liveBpm: number;
  liveHrv: number;
  history: TelemetryPoint[];
  isConnected: boolean;
  isSyncing: boolean;
  batteryLevel: number | null;
  sensorQuality: 'excellent' | 'good' | 'poor' | 'searching';
  
  // Actions
  setConnectionState: (connected: boolean) => void;
  setSyncingState: (syncing: boolean) => void;
  addTelemetryPoint: (point: TelemetryPoint) => void;
  updateBattery: (level: number) => void;
  updateSensorQuality: (quality: 'excellent' | 'good' | 'poor' | 'searching') => void;
  reset: () => void;
}

// BATCHING ENGINE 
// To prevent 5Hz React rerenders from BLE, we batch updates
let pendingTelemetry: TelemetryPoint[] = [];
let batchTimeout: ReturnType<typeof setTimeout> | null = null;

export const useTelemetryStore = create<TelemetryState>((set) => ({
  liveBpm: 0,
  liveHrv: 0,
  history: [],
  isConnected: false,
  isSyncing: false,
  batteryLevel: null,
  sensorQuality: 'searching',

  setConnectionState: (connected) => set({ isConnected: connected }),
  setSyncingState: (syncing) => set({ isSyncing: syncing }),
  
  addTelemetryPoint: (point) => {
    // Normalizing frequent writes - store in buffer
    pendingTelemetry.push(point);
    
    if (!batchTimeout) {
      batchTimeout = setTimeout(() => {
        set((state) => {
          const freshHistory = [...state.history, ...pendingTelemetry].slice(-60); // 60s window
          const latest = pendingTelemetry[pendingTelemetry.length - 1];
          pendingTelemetry = [];
          batchTimeout = null;
          
          return {
            history: freshHistory,
            liveBpm: latest.bpm,
            liveHrv: latest.hrv
          };
        });
      }, 500); // Only flush to UI twice per second (2Hz max)
    }
  },

  updateBattery: (level) => set({ batteryLevel: level }),
  updateSensorQuality: (quality) => set({ sensorQuality: quality }),

  reset: () => set({
    liveBpm: 0,
    liveHrv: 0,
    history: [],
    isConnected: false,
    sensorQuality: 'searching',
    batteryLevel: null,
  }),
}));
