import { logger } from '../observability/logger';
import { metrics } from '../observability/metrics';

/**
 * Dead Letter Queue (DLQ) Service
 * 
 * Captures events that failed to process across all retries, or were rejected
 * due to unrecoverable errors (e.g. malformed payloads). 
 * Prevents poison messages from infinitely looping, and allows operational recovery.
 */
export class DeadLetterQueue {
  public async enqueue(eventName: string, payload: any, errorReason: string) {
    // In production, push to a Kafka DLQ topic, SQS queue, or a specific Postgres table.
    
    // For now, we log structure and emit metrics for observability.
    logger.warn(`Event moved to DLQ: ${eventName}`, { 
      event: 'DLQ_ENQUEUE', 
      eventName, 
      errorReason,
      // Stringify or slice payload if extremely large to prevent OOM
      payloadPreview: JSON.stringify(payload).substring(0, 500) 
    });
    
    metrics.increment('dlq_enqueued_total');
  }
}

export const dlq = new DeadLetterQueue();
