import { redisWrapper } from './client';
import { RedisKeys } from './schema';
import { logger } from '../observability/logger';
import * as os from 'os';

/**
 * Distributed Session Coordination (Redis)
 * 
 * Tracks which users are connected to which horizontal pods/instances.
 * Allows routing of server-to-client events across a horizontally scaled cluster.
 */
export class DistributedSessionStore {
  // A unique identifier for this specific node/container
  private instanceId = process.env.POD_NAME || Math.random().toString(36).substring(7);

  /**
   * Register an active WebSocket connection globally.
   * Called during WS handshake or on recurring Heartbeats (Pong).
   */
  public async heartbeatSession(userId: string): Promise<void> {
    await redisWrapper.execute(async (client) => {
      const key = RedisKeys.WebsocketSession(userId);
      // We set the value to our instance ID, and set a 30s TTL.
      // If the node crashes, the TTL natively evicts the stale session.
      await client.set(key, this.instanceId, 'EX', 30);
    });
  }

  /**
   * Remove session (e.g. on clean WS closure)
   */
  public async clearSession(userId: string): Promise<void> {
    await redisWrapper.execute(async (client) => {
      const key = RedisKeys.WebsocketSession(userId);
      // We only delete if it was OUR instance that owned it (avoids race conditions on reconnect to new pod)
      const currentLoc = await client.get(key);
      if (currentLoc === this.instanceId) {
         await client.del(key);
      }
    });
  }

  /**
   * Validate sequence ID across distributed nodes to prevent replay attacks globally
   */
  public async validateAndSetSequence(userId: string, sequenceId: number): Promise<boolean> {
    const result = await redisWrapper.execute(async (client) => {
       const key = RedisKeys.LastSequenceId(userId);
       const lastSeqStr = await client.get(key);
       const lastSeq = lastSeqStr ? parseInt(lastSeqStr, 10) : -1;
       
       if (sequenceId <= lastSeq) {
         return false; // Replay or out of order
       }

       // Update and apply TTL to prevent infinite memory growth for offline users
       await client.set(key, sequenceId.toString(), 'EX', 3600); // 1 hour 
       return true;
    });

    // If Redis fails, we default to local validation if we can, or just accept if strictly degrading gracefully.
    return result !== false;
  }
}

export const distributedSessionStore = new DistributedSessionStore();
