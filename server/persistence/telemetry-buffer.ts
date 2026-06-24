import { TelemetryValidatedPayload } from '../events/domain-events';
import { TimeSeriesSummary } from './types';
import { CircuitBreaker } from '../resilience/circuit-breaker';
import { logger } from '../observability/logger';
import { metrics } from '../observability/metrics';

interface BufferState {
  userId: string;
  windowStart: number;
  points: TelemetryValidatedPayload[];
  anomalyCount: number;
}

/**
 * Telemetry Aggregation Buffer
 * 
 * Collects high-frequency telemetry points and aggregates them into time-window summaries.
 * Uses a Circuit Breaker to gracefully degrade if the downstream database is failing, 
 * discarding batched analytics safely without crashing the real-time node.
 */
export class TelemetryBuffer {
  private buffers: Map<string, BufferState> = new Map();
  private readonly FLUSH_INTERVAL_MS = 60000; // 1-minute aggregation chunks
  
  // Fast-fail DB connection logic
  private dbCircuitBreaker = new CircuitBreaker('TimescaleDB_Write', { 
    failureThreshold: 3, 
    resetTimeoutMs: 30000 
  });

  constructor() {
    // Start flush scheduler
    setInterval(() => this.flushAll(), this.FLUSH_INTERVAL_MS);
  }

  public addPoint(payload: TelemetryValidatedPayload) {
    const { userId, timestamp } = payload;
    let state = this.buffers.get(userId);

    if (!state) {
      state = {
        userId,
        windowStart: timestamp,
        points: [],
        anomalyCount: 0
      };
      this.buffers.set(userId, state);
    }

    state.points.push(payload);
  }

  public trackAnomaly(userId: string) {
    const state = this.buffers.get(userId);
    if (state) {
      state.anomalyCount += 1;
    }
  }

  private async flushAll() {
    const summaries: TimeSeriesSummary[] = [];

    // Safely iterate and swap buffers
    for (const [userId, state] of this.buffers.entries()) {
      if (state.points.length === 0) continue;

      const summary = this.aggregate(state);
      if (summary) {
        summaries.push(summary);
      }

      // Reset state for next window
      state.points = [];
      state.windowStart = Date.now();
      state.anomalyCount = 0;
    }

    if (summaries.length > 0) {
      this.persistBatch(summaries);
    }
  }

  private aggregate(state: BufferState): TimeSeriesSummary | null {
    if (state.points.length === 0) return null;

    const bpms = state.points.map(p => p.bpm);
    const minBpm = Math.min(...bpms);
    const maxBpm = Math.max(...bpms);
    const avgBpm = bpms.reduce((sum, val) => sum + val, 0) / bpms.length;

    // Calculate Tachycardia Duration (>100 as generic threshold for analytics)
    let tachycardiaMs = 0;
    let currentTachyStart = 0;
    for (const p of state.points) {
      if (p.bpm > 100) {
        if (currentTachyStart === 0) currentTachyStart = p.timestamp;
      } else {
        if (currentTachyStart > 0) {
          tachycardiaMs += (p.timestamp - currentTachyStart);
          currentTachyStart = 0;
        }
      }
    }
    if (currentTachyStart > 0) {
      tachycardiaMs += (state.points[state.points.length - 1].timestamp - currentTachyStart);
    }

    // Estimate Signal Quality (Ratio of expected vs received packets, assuming 0.5Hz expected ~30pts/min)
    const expectedPoints = 30; // Assuming 1 packet every 2 seconds
    const density = Math.min(state.points.length / expectedPoints, 1.0);
    const consistencyPenalty = state.anomalyCount * 0.05;
    const signalQuality = Math.max(0, density - consistencyPenalty);

    return {
      userId: state.userId,
      windowStart: state.windowStart,
      windowEnd: state.points[state.points.length - 1].timestamp,
      avgBpm,
      minBpm,
      maxBpm,
      sampleCount: state.points.length,
      signalQuality,
      tachycardiaDurationMs: tachycardiaMs,
      anomalyCount: state.anomalyCount
    };
  }

  private async persistBatch(summaries: TimeSeriesSummary[]) {
    // Database integration point!
    // Runs asynchronously, protected by Circuit Breaker.
    setImmediate(async () => {
      const start = performance.now();
      try {
        await this.dbCircuitBreaker.execute(async () => {
          logger.info(`Flushing batch of ${summaries.length} Time-Series Summaries to DB`, { event: 'PERSISTENCE_FLUSH_START', count: summaries.length });
          
          // Simulated persistence action (e.g., await db.insert(telemetrySummaries).values(summaries))
          // Simulate occasional random timeout to show resilience:
          if (Math.random() < 0.02) { throw new Error('DB Connection Timeout'); }

          // Tracking metrics
          const avgSq = summaries.reduce((acc, curr) => acc + curr.signalQuality, 0) / summaries.length;
          metrics.observe('signal_quality_average', avgSq);
          metrics.observe('persistence_flush_duration_ms', performance.now() - start);
        });
      } catch (error: any) {
        // Graceful Degradation:
        // We drop the analytics batch. The alternative is memory bound-busting if the DB is down for hours.
        // It is better to lose historical statistics than crash the immediate realtime Emergency Alert pipeline.
        logger.error('Batch flush failed. Shedding persistence load to protect node health.', error.message, { event: 'PERSISTENCE_SHED_LOAD' });
        metrics.increment('persistence_dropped_batches');
      }
    });
  }
}

export const telemetryBuffer = new TelemetryBuffer();
