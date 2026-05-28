export interface ITelemetryRepository {
  saveTelemetry(userId: string, data: any): Promise<void>;
  getTelemetryHistory(userId: string, startTime: number, endTime: number): Promise<any[]>;
}
