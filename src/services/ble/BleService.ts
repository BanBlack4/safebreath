/**
 * SafeBreath MVP - BleService
 * Production-oriented Bluetooth manager orchestrating connection, 
 * data ingest, and state sharing.
 */

import { PacketNormalizer, RawBlePacket } from './PacketNormalizer';
import { ConnectionStrategy } from './ConnectionStrategy';

// In a real RN app: import { BleManager, Device } from 'react-native-ble-plx';
// We use a stub here since we are rendering mock interfaces for the web preview.

export class BleService {
  private static instance: BleService;
  private normalizer = new PacketNormalizer();
  private connectionStrategy = new ConnectionStrategy();
  
  // Stubs for BLE primitives
  private bleManagerMode = 'STUB'; 
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private onTelemetryCallback: ((data: any) => void) | null = null;
  private connectionStateCallback: ((connected: boolean) => void) | null = null;

  private constructor() {
    console.log("[BleService] Initialized real singleton");
  }

  public static getInstance(): BleService {
    if (!BleService.instance) {
      BleService.instance = new BleService();
    }
    return BleService.instance;
  }

  public setCallbacks(
    onTelemetry: (data: any) => void, 
    onConnectionChange: (state: boolean) => void
  ) {
    this.onTelemetryCallback = onTelemetry;
    this.connectionStateCallback = onConnectionChange;
  }

  public async startScanningAndPair() {
    this.connectionStateCallback?.(false);
    console.log("[BleService] Scanning for Heart Rate service...");
    
    // Simulate finding a device
    setTimeout(() => {
        console.log("[BleService] Device discovered. Negotiating MTU...");
        this.connect({ hardwareId: 'BLE_01', name: 'SafeBreath Device' });
    }, 2000);
  }

  private connect(device: any) {
    console.log(`[BleService] Connected to ${device.name}`);
    this.connectionStrategy.reset();
    this.connectionStateCallback?.(true);
    this.kickWatchdog();
    
    // Simulate incoming characteristic notifications
    setInterval(() => {
      this.handleIncomingRawRead({
        deviceHardwareId: device.hardwareId,
        heartRate: 60 + Math.random() * 5,
        rssi: -60 - Math.random() * 20
      });
    }, 1000);
  }

  private handleIncomingRawRead(raw: RawBlePacket) {
    this.kickWatchdog();
    const normalized = this.normalizer.normalize(raw);
    
    if (normalized) {
      this.onTelemetryCallback?.(normalized);
    }
  }

  private kickWatchdog() {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    // If no data arrives in 10 seconds, drop connection and retry
    this.watchdogTimer = setTimeout(() => {
      console.warn("[BleService] Watchdog timeout - Stale Connection detected.");
      this.handleDisconnect();
    }, 10000);
  }

  private handleDisconnect() {
    console.log("[BleService] Peripheral dropped.");
    this.connectionStateCallback?.(false);
    
    // Trigger resilient reconnection sequence
    this.connectionStrategy.startReconnectionSequence(async () => {
       console.log("[BleService] Attempting exponential backoff reconnection...");
       // Logic to call connectToDevice(savedMacAddress) goes here
       // Throw error if failed to trigger the next backoff cycle
       throw new Error("Reconnect fail simulation");
    });
  }
}
