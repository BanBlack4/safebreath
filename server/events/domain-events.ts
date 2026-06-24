export enum DomainEvents {
  TelemetryReceived = 'telemetry.received',
  TelemetryValidated = 'telemetry.validated',
  TelemetryRejected = 'telemetry.rejected',
  AlertTriggered = 'alert.triggered',
  AlertEscalated = 'alert.escalated',
  NotificationQueued = 'notification.queued',
  EmergencyWorkflowStarted = 'emergency.started'
}

export interface TelemetryValidatedPayload {
  userId: string;
  bpm: number;
  hrv?: number;
  stressLevel?: number;
  timestamp: number;
  ingestedAt: number;
}

export interface TelemetryRejectedPayload {
  userId: string;
  reason: string;
  packetInfo: any;
}

export interface AlertTriggeredPayload {
  userId: string;
  alertType: 'HIGH_BPM' | 'ANXIETY_PATTERN' | 'IRREGULAR_HEARTBEAT';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  triggerData: any;
  timestamp: number;
}

export interface NotificationQueuedPayload {
  userId: string;
  type: string;
  message: string;
  priority: 'low' | 'high' | 'critical';
}
