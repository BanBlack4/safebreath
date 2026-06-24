import Redis from 'ioredis';
import { logger } from '../observability/logger';
import { metrics } from '../observability/metrics';
import { CircuitBreaker } from '../resilience/circuit-breaker';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Distributed Redis Client Structure
 * Provides high availability, reconnection logic, and observability points.
 */
class DistributedRedis {
  public client: Redis | null = null;
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('Redis_Connection', {
      failureThreshold: 5,
      resetTimeoutMs: 15000,
    });

    // We allow optional initialization to gracefully degrade to in-memory if Redis is unavailable
    if (process.env.ENABLE_REDIS === 'true') {
      this.init();
    } else {
      logger.info('Redis integration disabled. Running in local memory mode.', { event: 'REDIS_DISABLED' });
    }
  }

  private init() {
    this.client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.client.on('connect', () => {
      logger.info('Connected to Redis backend', { event: 'REDIS_CONNECTED' });
      metrics.setGauge('redis_connection_status', 1);
    });

    this.client.on('error', (err) => {
      logger.error('Redis connection error', err, { event: 'REDIS_ERROR' });
      metrics.setGauge('redis_connection_status', 0);
    });
  }

  /**
   * Safely execute Redis commands wrapped in our Circuit Breaker
   * If Redis fails, we gracefully degrade (or throw up the stack to shed load)
   */
  public async execute<T>(operation: (client: Redis) => Promise<T>): Promise<T | null> {
    if (!this.client) return null; // Graceful degradation return

    const start = performance.now();
    try {
      const result = await this.circuitBreaker.execute(() => operation(this.client as Redis));
      metrics.observe('redis_operation_duration_ms', performance.now() - start);
      return result;
    } catch (err: any) {
      metrics.increment('redis_operation_failures');
      logger.warn('Redis execution blocked by circuit breaker or timeout', { event: 'REDIS_EXEC_FAIL', error: err.message });
      return null; // Gracefully degrade by returning null
    }
  }
}

export const redisWrapper = new DistributedRedis();
