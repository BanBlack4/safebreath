import { logger } from '../observability/logger';
import { metrics } from '../observability/metrics';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

/**
 * Circuit Breaker Pattern
 * 
 * Prevents cascading failures across the system. If a downstream dependency (e.g. DB, external API)
 * begins failing, the circuit opens to fail fast and shed load, giving the dependency time to recover.
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private nextAttemptMs = 0;

  constructor(private name: string, private options: CircuitBreakerOptions) {}

  public async execute<T>(action: () => Promise<T>, fallback?: () => T): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttemptMs) {
        this.state = 'HALF_OPEN';
        logger.info(`Circuit Breaker [${this.name}] entering HALF_OPEN state`, { event: 'CIRCUIT_HALF_OPEN', breaker: this.name });
      } else {
        metrics.increment(`circuit_breaker_${this.name}_rejected`);
        if (fallback) {
          return fallback();
        }
        throw new Error(`Circuit Breaker [${this.name}] is OPEN`);
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      if (fallback) {
        return fallback();
      }
      throw err;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info(`Circuit Breaker [${this.name}] recovered and CLOSED`, { event: 'CIRCUIT_CLOSED', breaker: this.name });
    }
  }

  private onFailure(err: any) {
    this.failureCount++;
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.options.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptMs = Date.now() + this.options.resetTimeoutMs;
      logger.error(`Circuit Breaker [${this.name}] tripped to OPEN`, err, { event: 'CIRCUIT_OPEN', breaker: this.name });
    }
  }
}
