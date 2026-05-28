import { redisWrapper } from './client';
import { RedisKeys } from './schema';
import { TelemetryDatapoint, TemporalWindow } from '../rules/types';
import { logger } from '../observability/logger';

/**
 * Distributed Temporal Window Store (Redis Backed)
 * 
 * Replaces the local memory map.
 * Uses Redis Sorted Sets (ZSET) to achieve highly efficient O(log(N)) sliding windows.
 * Essential for scaling websocket ingestion across multiple horizontal Pods
 * without losing the temporal context required for the Rule Engine.
 */
export class RedisTemporalWindowStore {
  private defaultWindowSizeMs = 60000; // 60s sliding window

  /**
   * Adds a telemetry point to the distributed sliding window.
   * Atomic operation using Redis Multi pipeline.
   */
  public async addPoint(userId: string, point: TelemetryDatapoint): Promise<TemporalWindow | null> {
    return redisWrapper.execute(async (client) => {
      const key = RedisKeys.TemporalWindow(userId);
      const oldestAllowed = point.timestamp - this.defaultWindowSizeMs;

      // Pipeline allows atomic execution of the sliding window maintenance
      const pipeline = client.multi();

      // 1. Add new point (Score = timestamp)
      pipeline.zadd(key, point.timestamp, JSON.stringify(point));
      
      // 2. Erase elements older than the sliding window threshold
      pipeline.zremrangebyscore(key, '-inf', oldestAllowed);

      // 3. Set a pessimistic TTL so the entire key evaporates if client disconnects
      // We set TTL to 2x the window size.
      pipeline.expire(key, Math.floor((this.defaultWindowSizeMs * 2) / 1000));

      // 4. Retrieve the valid sliding window for Rule Engine evaluation
      pipeline.zrange(key, 0, -1);

      const results = await pipeline.exec();

      if (!results || results.length < 4) {
         logger.warn('Failed to commit Redis temporal window pipeline', { event: 'REDIS_TMP_WINDOW_FAIL', userId });
         return null;
      }

      // The last response from the pipeline is the zrange result
      const rangeResult = results[3][1] as string[];
      
      const parsedPoints: TelemetryDatapoint[] = rangeResult.map(val => JSON.parse(val));

      return {
        userId,
        points: parsedPoints,
        windowSizeMs: this.defaultWindowSizeMs
      };
    });
  }
}

export const redisTemporalWindowStore = new RedisTemporalWindowStore();
