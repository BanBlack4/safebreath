import { EventEmitter } from 'events';
import { DomainEvents } from './domain-events';
import { metrics } from '../observability/metrics';
import { logger } from '../observability/logger';
import { dlq } from '../resilience/dlq.service';

/**
 * Internal Event Bus Application Facade
 * 
 * Abstracts Node.js EventEmitter to provide a unified pub/sub interface.
 * Implements Backpressure through Bounded Queues to prevent Memory Out of Bounds (OOM).
 */
class AppEventBus {
  private emitter = new EventEmitter();
  
  // Bounded Queue limits
  private maxInFlightEvents = 5000;
  private currentInFlightEvents = 0;

  constructor() {
    this.emitter.setMaxListeners(20);
  }

  /**
   * Publish an event to the bus.
   * Consumers run asynchronously to prevent blocking the publisher.
   */
  public publish<T>(eventName: DomainEvents, payload: T): void {
    // 1. Backpressure / Shedding load if queue depth is too high!
    if (this.currentInFlightEvents >= this.maxInFlightEvents) {
      logger.error(`Event Bus Overloaded! Shedding event load: ${eventName}`, null, { event: 'EVENT_BUS_OVERFLOW', eventName });
      metrics.increment('event_bus_overflow_total');
      // Depending on the event type, we might enqueue to DLQ here, but if memory is pressured, shedding is safer.
      return; 
    }

    this.currentInFlightEvents++;
    metrics.setGauge('event_bus_queue_depth', this.currentInFlightEvents);

    setImmediate(() => {
      this.emitter.emit(eventName, payload);
    });
  }

  /**
   * Subscribe to an event.
   * Wraps the handler to catch unhandled promise rejections.
   */
  public subscribe<T>(eventName: DomainEvents, handler: (payload: T) => Promise<void> | void): void {
    this.emitter.on(eventName, async (payload: T) => {
      try {
        await handler(payload);
      } catch (error) {
        logger.error(`Error processing event ${eventName}:`, error, { event: 'EVENT_BUS_CONSUMER_ERR' });
        this.handleDeadLetter(eventName, payload, error);
      } finally {
        this.currentInFlightEvents--;
        metrics.setGauge('event_bus_queue_depth', this.currentInFlightEvents);
      }
    });

    logger.info(`Consumer subscribed to ${eventName}`, { event: 'EVENT_BUS_SUBSCRIBE' });
  }

  private handleDeadLetter(eventName: string, payload: any, error: any) {
    // Send to formal Dead Letter Queue logic
    dlq.enqueue(eventName, payload, error?.message || 'Unknown Consumer Error').catch(e => {
        logger.error('Failed to enqueue into DLQ', e, { event: 'DLQ_ENQUEUE_FAIL' });
    });
  }
}

export const eventBus = new AppEventBus();
