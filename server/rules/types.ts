export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface TelemetryDatapoint {
  bpm: number;
  hrv?: number;
  stressLevel?: number;
  timestamp: number;
}

export interface RuleEvaluationResult {
  triggered: boolean;
  riskLevel: RiskLevel;
  confidence: number; // 0.0 to 1.0 (1.0 = high confidence)
  ruleId: string;
  reason: string;
}

export interface TemporalWindow {
  userId: string;
  points: TelemetryDatapoint[];
  windowSizeMs: number;
}
