import { z } from 'zod';

export const TelemetryPacketSchema = z.object({
  type: z.literal('TELEMETRY_INGEST'),
  payload: z.object({
    bpm: z.number().min(30, 'BPM strictly bounded').max(250, 'BPM strictly bounded'),
    hrv: z.number().min(0).max(200).optional(),
    stressLevel: z.number().min(0).max(100).optional(),
    timestamp: z.number(), // Client-side Unix timestamp for latency tracking
    sequenceId: z.number(), // Sequence ID to prevent replay and out-of-order execution
    deviceId: z.string().optional(),
  })
});

export type TelemetryPacket = z.infer<typeof TelemetryPacketSchema>;
