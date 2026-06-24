import { eventBus } from '../event-bus';
import { DomainEvents, TelemetryValidatedPayload, TelemetryRejectedPayload } from '../domain-events';
import { telemetryBuffer } from '../../persistence/telemetry-buffer';

/**
 * Telemetry Persistence Consumer
 * 
 * Intercepts events from the ingestion pipeline and buffers them for
 * efficient batch processing to external Time-Series databases (TimescaleDB).
 */
export class TelemetryPersistenceConsumer {
  public register() {
    eventBus.subscribe<TelemetryValidatedPayload>(
      DomainEvents.TelemetryValidated, 
      this.handleValidatedTelemetry.bind(this)
    );

    // Track anomalies separately to penalize signal quality
    eventBus.subscribe<TelemetryRejectedPayload>(
      DomainEvents.TelemetryRejected,
      this.handleRejectedTelemetry.bind(this)
    );
  }

  private async handleValidatedTelemetry(payload: TelemetryValidatedPayload) {
    // Pass to temporal batching buffer instead of saving directly to DB
    telemetryBuffer.addPoint(payload);
  }

  private async handleRejectedTelemetry(payload: TelemetryRejectedPayload) {
    // Only track noise/spike rejections as anomalies (not out-of-order dupes)
    if (payload.reason === 'NOISE_SPIKE_REJECTED') {
      telemetryBuffer.trackAnomaly(payload.userId);
    }
  }
}

export const telemetryPersistenceConsumer = new TelemetryPersistenceConsumer();
