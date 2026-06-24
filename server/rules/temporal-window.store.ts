import { TelemetryDatapoint, TemporalWindow } from './types';
import { logger } from '../observability/logger';

/**
 * Temporal Window Store (In-Memory Abstraction)
 * 
 * In a distributed, scalable environment, this should be backed by Redis.
 * Handles eviction of historical data actively within bounds, and cleans
 * completely stale disconnected logic passively to prevent memory leaks.
 */
export class TemporalWindowStore {
  private windows: Map<string, { points: TelemetryDatapoint[], windowSizeMs: number }> = new Map();
  
  // Default evaluation window size is 60 seconds of telemetry
  private defaultWindowSizeMs = 60000; 

  // Memory Eviction Interval
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Run Garbage Collection for disconnected clients every 2 minutes
    this.cleanupInterval = setInterval(() => this.evictStaleConnections(), 120000);
  }

  /**
   * Adds a telemetry point to the user's temporal window, 
   * evicting points older than windowSizeMs.
   */
  public addPoint(userId: string, point: TelemetryDatapoint): TemporalWindow {
    if (!this.windows.has(userId)) {
      this.windows.set(userId, { points: [], windowSizeMs: this.defaultWindowSizeMs });
    }
    
    const window = this.windows.get(userId)!;
    window.points.push(point);

    // Evict old points outside the sliding window
    const oldestAllowed = point.timestamp - window.windowSizeMs;
    window.points = window.points.filter(p => p.timestamp >= oldestAllowed);

    return {
      userId,
      points: window.points,
      windowSizeMs: window.windowSizeMs
    };
  }

  /**
   * Prevents memory leaks if a client disconnects unexpectedly without closing the session properly
   */
  private evictStaleConnections() {
    const now = Date.now();
    let evictedCount = 0;
    
    for (const [userId, window] of this.windows.entries()) {
      const latestPoint = window.points[window.points.length - 1];
      
      // If we haven't received a point in over 2x the window size (2 minutes), they are stale.
      if (!latestPoint || (now - latestPoint.timestamp > this.defaultWindowSizeMs * 2)) {
        this.windows.delete(userId);
        evictedCount++;
      }
    }

    if (evictedCount > 0) {
      logger.info(`Evicted ${evictedCount} stale temporal windows to reclaim memory.`, { event: 'MEMORY_EVICT_WINDOWS', count: evictedCount });
    }
  }
}

export const temporalWindowStore = new TemporalWindowStore();
