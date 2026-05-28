import { eventBus } from '../event-bus';
import { DomainEvents, AlertTriggeredPayload, NotificationQueuedPayload } from '../domain-events';

/**
 * Notification Consumer
 * 
 * Orchestrates external communication (Email, SMS, Push, WhatsApp).
 * Listens for systemic Alert events and translates them into Notification events.
 */
export class NotificationConsumer {
  public register() {
    eventBus.subscribe<AlertTriggeredPayload>(
      DomainEvents.AlertTriggered, 
      this.handleAlert.bind(this)
    );
  }

  private async handleAlert(payload: AlertTriggeredPayload) {
    console.log(`[NotificationConsumer] Evaluating routing for Alert: ${payload.alertType}`);
    
    // Example orchestration: If it's a high severity alert, queue an SMS notification
    if (payload.severity === 'high' || payload.severity === 'critical') {
      const emailNotification: NotificationQueuedPayload = {
        userId: payload.userId,
        type: 'EMAIL',
        priority: 'high',
        message: `High alert triggered: ${payload.alertType}`
      };
      
      // Publish the intention to send a notification (handled by a low-level worker later)
      eventBus.publish(DomainEvents.NotificationQueued, emailNotification);
    }
  }
}

export const notificationConsumer = new NotificationConsumer();
