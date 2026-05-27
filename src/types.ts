/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppScreen = 'dashboard' | 'vitals' | 'profile' | 'history' | 'event-detail' | 'active-alert' | 'devices' | 'admin-dashboard';

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'watch' | 'oximeter' | 'inhaler' | 'spirometer';
  status: 'connected' | 'disconnected' | 'simulated';
  bpm?: number;
  spo2?: number;
  battery?: number;
  lastSync?: string;
  detailMessage?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  countryCode?: string;
  relation: string;
}

export interface UserProfile {
  edad: number;
  genero: string;
  peso: number;
  altura: number;
  asma: boolean;
  hipertension: boolean;
  ansiedad: boolean;
  epoc: boolean;
  alergias: boolean;
  bpmReposo: number;
  emergencyContacts?: EmergencyContact[];
}

export interface ReflectionLog {
  id: string;
  timestamp: string;
  mood: 'Calm' | 'Neutral' | 'Anxious';
  tightness: string[];
}

export interface HealthEvent {
  id: string;
  title: string;
  type: 'critical' | 'vital_peak' | 'checkin' | 'anxiety';
  time: string;
  dateStr: string;
  description: string;
  badge?: string;
  details?: {
    peakBpm?: number;
    status?: string;
    resolvedIn?: string;
    duration?: string;
    actionTaken?: string;
    notes?: string;
    spo2?: number;
    hrvTrend?: string;
    bpm?: number;
    mood?: string;
    activity?: string;
  };
}
