import { alertConsumer } from './consumers/alert.consumer';
import { notificationConsumer } from './consumers/notification.consumer';
import { telemetryPersistenceConsumer } from './consumers/telemetry-persistence.consumer';
// import { analyticsConsumer } from './consumers/analytics.consumer';

export function registerEventConsumers() {
  console.log('[Orchestrator] Registering Internal Domain Event Consumers...');
  
  // Register domain consumers
  alertConsumer.register();
  notificationConsumer.register();
  telemetryPersistenceConsumer.register();
  // analyticsConsumer.register();
}
