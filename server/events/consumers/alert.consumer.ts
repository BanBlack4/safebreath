import { eventBus } from '../event-bus';
import { DomainEvents, TelemetryValidatedPayload, AlertTriggeredPayload } from '../domain-events';
import { temporalWindowStore } from '../../rules/temporal-window.store';
import { ruleEngine } from '../../rules/engine';
import { metrics } from '../../observability/metrics';
import { logger } from '../../observability/logger';

/**
 * Alert Consumer (Rule Engine Orchestrator)
 * 
 * Subscribes to validated telemetry streams, aggregates temporal windows,
 * and passes them into the Deterministic Rule Engine for evaluation.
 */
export class AlertConsumer {
  public register() {
    eventBus.subscribe<TelemetryValidatedPayload>(
      DomainEvents.TelemetryValidated, 
      this.handleTelemetry.bind(this)
    );
  }

  private async handleTelemetry(payload: TelemetryValidatedPayload) {
    // 1. Maintain sliding temporal window (Temporal Correlation)
    const window = temporalWindowStore.addPoint(payload.userId, {
      bpm: payload.bpm,
      hrv: payload.hrv,
      stressLevel: payload.stressLevel,
      timestamp: payload.timestamp
    });

    // 2. Evaluate business rules deterministically
    const evaluations = await metrics.measureDuration('rule_evaluation_duration_ms', () => {
      return ruleEngine.evaluateAll(window);
    });

    // 3. Filter for triggered escalation rules mapped to High or Critical threshold
    for (const result of evaluations) {
      if (result.triggered && (result.riskLevel === 'high' || result.riskLevel === 'critical')) {
        
        // 4. Ensure confidence is adequate before dispatching critical events 
        // to mitigate false positives due to BLE jitter.
        if (result.confidence > 0.8) {
          logger.warn(`Escalating Rule Event`, { event: 'RULE_ESCALATION', ruleId: result.ruleId, userId: payload.userId, reason: result.reason });
          metrics.increment('alert_trigger_rate');
          
          const alertPayload: AlertTriggeredPayload = {
            userId: payload.userId,
            alertType: 'HIGH_BPM', // Can be mapped to result.ruleId
            severity: result.riskLevel,
            triggerData: { 
              evaluation: result, 
              currentBpm: payload.bpm 
            },
            timestamp: Date.now()
          };

          eventBus.publish(DomainEvents.AlertTriggered, alertPayload);
        } else {
          logger.info(`Flagged rule but confidence too low to escalate`, { event: 'LOW_CONFIDENCE_FLAG', ruleId: result.ruleId, confidence: result.confidence });
        }
      }
    }
  }
}

export const alertConsumer = new AlertConsumer();
