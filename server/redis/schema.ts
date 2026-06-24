/**
 * Redis Key Schema Design
 * 
 * Consistent schema is critical in a distributed system to avoid key collisions
 * and to allow predictable temporal eviction (TTL).
 * 
 * Pattern: namespace:entity_type:entity_id[:subtype]
 */

export const RedisKeys = {
  /**
   * Sliding Temporal Window (Sorted Set)
   * Key: sb:telemetry:window:{userId}
   * Score: timestamp
   * Value: JSON { bpm, hrv, timestamp }
   * TTL: Managed via ZREMRANGEBYSCORE and explicit EXPIRE
   */
  TemporalWindow: (userId: string) => `sb:telemetry:window:${userId}`,

  /**
   * Distributed WebSocket Session State (Hash or String)
   * Key: sb:session:ws:{userId}
   * Value: server_instance_id (useful to resolve "which pod is this user connected to")
   * TTL: 5 minutes (Refreshed constantly by active heartbeat)
   */
  WebsocketSession: (userId: string) => `sb:session:ws:${userId}`,

  /**
   * Distributed Rate Limiting (String / Counter)
   * Key: sb:ratelimit:ingest:{userId}:{current_second}
   * Value: Count
   * TTL: 2 seconds
   */
  IngestionRateLimit: (userId: string, second: number) => `sb:ratelimit:ingest:${userId}:${second}`,

  /**
   * Replay Protection CheckSequence (String)
   * Key: sb:replay:seq:{userId}
   * Value: Highest seen sequenceId
   * TTL: 1 hour (Evicted if user is inactive, protecting hot memory)
   */
  LastSequenceId: (userId: string) => `sb:replay:seq:${userId}`,

  /**
   * Global Event Pub/Sub Channel (Channel)
   * Useful when migrating internal 'eventBus' to be multi-node.
   */
  PubSubChannel: (topic: string) => `sb:events:${topic}`,
};
