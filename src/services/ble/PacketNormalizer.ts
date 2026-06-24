/**
 * SafeBreath MVP - Packet Normalization
 * Normalizes hardware-specific BLE packets into a deterministic structure.
 */

export interface RawBlePacket {
  deviceHardwareId: string;
  heartRate: number;
  rrIntervals?: number[];
  batteryLevel?: number;
  rssi: number;
}

export interface NormalizedTelemetry {
  bpm: number;
  hrv: number;
  confidence: number;
  timestamp: number;
  hardwareId: string;
}

export class PacketNormalizer {
  private lastPacketTimestamp = 0;
  
  public normalize(raw: RawBlePacket): NormalizedTelemetry | null {
    const now = Date.now();
    
    // Drop duplicates or out-of-order bounds
    if (now - this.lastPacketTimestamp < 200) {
      return null; 
    }
    this.lastPacketTimestamp = now;

    // Calculate confidence based on RSSI
    let confidence = 1.0;
    if (raw.rssi < -90) confidence = 0.5;
    else if (raw.rssi < -80) confidence = 0.8;

    // Calculate mock HRV if RR intervals are provided (Simplified for MVP)
    let hrv = 0;
    if (raw.rrIntervals && raw.rrIntervals.length > 1) {
      const diffs = [];
      for (let i = 1; i < raw.rrIntervals.length; i++) {
        diffs.push(Math.pow(raw.rrIntervals[i] - raw.rrIntervals[i - 1], 2));
      }
      hrv = Math.sqrt(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    }

    return {
      bpm: raw.heartRate,
      hrv: hrv || 50, // Fallback safe baseline
      confidence,
      timestamp: now,
      hardwareId: raw.deviceHardwareId
    };
  }
}
