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

export interface Vital {
  id: string;
  timestamp: string;
  bpm: number;
  spo2: number;
  hrv: number;
  status: string;
  sourceDevice: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  level: 'low' | 'moderate' | 'high' | 'critical';
  reason: string;
  status: 'active' | 'resolved' | 'false_alarm';
  resolvedAt?: string;
}

export interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  type: string;
  durationSeconds: number;
  completed: boolean;
  effectivenessRating?: number;
}

export interface PanicEvent {
  id: string;
  timestamp: string;
  durationSeconds: number;
  triggers: string[];
  symptoms: string[];
  severity: number;
  userNotes?: string;
  resolvedWith?: string;
}

export interface LocationData {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  triggerEvent: string;
}

export interface Notification {
  id: string;
  timestamp: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
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
