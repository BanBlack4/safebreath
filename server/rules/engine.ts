import { TemporalWindow, RuleEvaluationResult } from './types';

/**
 * Deterministic Physiological Rule Engine
 * 
 * Evaluates sliding windows of biometric data against strictly defined rules.
 * All logic in here is deterministic, testable, and auditable.
 */
export class RuleEngine {
  /**
   * Rule: Sustained Tachycardia Anomaly (Rule T-01)
   * Detects abnormally high BPM sustained over a period, ignoring single-packet spikes.
   */
  public evaluateHighBPMPersistence(window: TemporalWindow): RuleEvaluationResult {
    const points = window.points;
    const ruleId = 'RULE_TACHY_01';
    const bpmThreshold = 120; // Example threshold, future can be personalized
    const criticalDurationMs = 30000; // 30 seconds
    const moderateDurationMs = 15000; // 15 seconds

    if (points.length < 5) {
      return { triggered: false, riskLevel: 'low', confidence: 0.1, ruleId, reason: 'Insufficient data points' };
    }

    const latest = points[points.length - 1];
    
    // Immediate early-exit if current reading is below threshold
    if (latest.bpm <= bpmThreshold) {
      return { triggered: false, riskLevel: 'low', confidence: 0.9, ruleId, reason: 'BPM currently within normal bounds' };
    }

    // Calculate how long the contiguous sequence of high BPM has persisted
    let persistencyMs = 0;
    
    for (let i = points.length - 1; i > 0; i--) {
      if (points[i].bpm > bpmThreshold && points[i - 1].bpm > bpmThreshold) {
        persistencyMs += (points[i].timestamp - points[i - 1].timestamp);
      } else {
        break; // Contiguous block broken by a normal reading
      }
    }

    // Risk Mapping based on temporal persistence
    if (persistencyMs >= criticalDurationMs) {
      return {
        triggered: true,
        riskLevel: 'critical',
        confidence: 0.95, // High confidence because it persisted > 30s safely
        ruleId,
        reason: `BPM > ${bpmThreshold} persisting continuously for ${Math.round(persistencyMs/1000)}s`
      };
    } 
    
    if (persistencyMs >= moderateDurationMs) {
      return {
        triggered: true,
        riskLevel: 'moderate',
        confidence: 0.75,
        ruleId,
        reason: `BPM > ${bpmThreshold} persisting continuously for ${Math.round(persistencyMs/1000)}s`
      };
    }

    return { 
      triggered: false, 
      riskLevel: 'low', 
      confidence: 0.5, 
      ruleId, 
      reason: `BPM spiked, but persistence (${Math.round(persistencyMs/1000)}s) too short for panic evaluation` 
    };
  }

  /**
   * Orchestrates multi-signal evaluation across all registered rules.
   */
  public evaluateAll(window: TemporalWindow): RuleEvaluationResult[] {
    const results: RuleEvaluationResult[] = [];
    
    // Run rule T-01
    results.push(this.evaluateHighBPMPersistence(window));
    
    // Extensibility: Run HRV rules, Drop rules, User specific rules here...
    
    return results;
  }
}

export const ruleEngine = new RuleEngine();
