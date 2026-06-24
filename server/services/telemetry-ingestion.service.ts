import { eventBus } from '../events/event-bus';
import { DomainEvents, TelemetryValidatedPayload, TelemetryRejectedPayload } from '../events/domain-events';
import { TelemetryPacket } from '../dto/telemetry.dto';
import { logger } from '../observability/logger';
import { metrics } from '../observability/metrics';

interface ClientSessionState {
  lastSequenceId: number;
  lastTimestamp: number;
  lastBpm: number | null;
  messageCount: number; // For rate limiting
  windowStartTime: number; // Rate limiting window
}

/**
 * Telemetry Ingestion Service
 * 
 * Responsibilities:
 * - Duplicate & Replay Attack Mitigation
 * - Out-of-Order Packet Handling
 * - Rate Limiting (Prevent WS flooding)
 * - Spike/Noise filtering
 * - Event Pipeline Emission via Global Event Bus
 */
export class TelemetryIngestionService {
  private sessions: Map<string, ClientSessionState> = new Map();

  // Rate Limiting Config
  private readonly MAX_MESSAGES_PER_SECOND = 10;
  // Replay Attack Config
  private readonly MAX_TIME_DRIFT_MS = 5000; // Accept max 5s latent packets

  /**
   * Process an incoming telemetry packet from a client websocket
   */
  public ingest(userId: string, packet: TelemetryPacket['payload']): void {
    const now = Date.now();
    let session = this.sessions.get(userId);
    
    // 1. Initialize session state
    if (!session) {
      session = {
        lastSequenceId: -1,
        lastTimestamp: 0,
        lastBpm: null,
        messageCount: 0,
        windowStartTime: now,
      };
      this.sessions.set(userId, session);
    }

    // 2. Rate Limiting (Flood Prevention)
    if (now - session.windowStartTime > 1000) {
      session.messageCount = 0;
      session.windowStartTime = now;
    }
    session.messageCount++;
    if (session.messageCount > this.MAX_MESSAGES_PER_SECOND) {
      logger.warn(`Rate limit exceeded`, { event: 'INGEST_RATE_LIMIT', userId });
      metrics.increment('dropped_packet_rate');
      return; // Drop packet
    }

    // 3. Replay Attack & Timestamp Validation
    const timeDrift = Math.abs(now - packet.timestamp);
    if (timeDrift > this.MAX_TIME_DRIFT_MS) {
      // Packet is too old or from the future
      logger.warn(`Time drift anomaly detected (${timeDrift}ms)`, { event: 'INGEST_DRIFT', userId, timeDrift });
      metrics.increment('dropped_packet_rate');
      return; 
    }

    // 4. Sequence & Out-of-Order validation
    if (packet.sequenceId <= session.lastSequenceId) {
      // Out of order or duplicate packet, drop it
      logger.warn(`Replay or out-of-order packet (Seq: ${packet.sequenceId})`, { event: 'INGEST_REPLAY', userId, sequenceId: packet.sequenceId });
      metrics.increment('dropped_packet_rate');
      eventBus.publish<TelemetryRejectedPayload>(DomainEvents.TelemetryRejected, {
        userId,
        reason: 'OUT_OF_ORDER',
        packetInfo: packet
      });
      return;
    }
    session.lastSequenceId = packet.sequenceId;

    // 5. Spike & Noise Filtering
    if (session.lastBpm !== null) {
      const bpmDelta = Math.abs(packet.bpm - session.lastBpm);
      if (bpmDelta > 40) {
        logger.warn(`Sensor noise spike detected. Dropping outlier: ${packet.bpm}`, { event: 'INGEST_NOISE_SPIKE', userId, bpm: packet.bpm });
        metrics.increment('dropped_packet_rate');
        eventBus.publish<TelemetryRejectedPayload>(DomainEvents.TelemetryRejected, {
          userId,
          reason: 'NOISE_SPIKE_REJECTED',
          packetInfo: packet
        });
        return; 
      }
    }
    session.lastBpm = packet.bpm;
    session.lastTimestamp = packet.timestamp;

    // 6. Normalization & Event Emission
    const normalizedTelemetry: TelemetryValidatedPayload = {
      userId,
      ...packet,
      ingestedAt: now,
    };

    // Publish to the global domain event bus!
    eventBus.publish(DomainEvents.TelemetryValidated, normalizedTelemetry);
  }

  /**
   * Cleans up disconnected sessions
   */
  public cleanSession(userId: string) {
    this.sessions.delete(userId);
  }
}

export const telemetryIngestionService = new TelemetryIngestionService();
