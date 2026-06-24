/**
 * SafeBreath MVP - BLE Connection Strategy
 * Handles exponential backoff and watchdog timers.
 */

export class ConnectionStrategy {
  private baseDelayMs = 2000;
  private maxDelayMs = 60000;
  private currentAttempt = 0;
  private isReconnecting = false;
  
  public getNextDelay(): number {
    const delay = Math.min(
      this.baseDelayMs * Math.pow(2, this.currentAttempt),
      this.maxDelayMs
    );
    this.currentAttempt++;
    return delay;
  }

  public reset() {
    this.currentAttempt = 0;
    this.isReconnecting = false;
  }

  public startReconnectionSequence(reconnectFn: () => Promise<void>) {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    
    const attempt = async () => {
      if (!this.isReconnecting) return;
      
      try {
        await reconnectFn();
        this.reset();
      } catch (err) {
        const delay = this.getNextDelay();
        console.warn(`[BLE Strategy] Reconnection failed, retrying in ${delay}ms`);
        setTimeout(attempt, delay);
      }
    };
    
    attempt();
  }
  
  public stop() {
    this.isReconnecting = false;
  }
}
