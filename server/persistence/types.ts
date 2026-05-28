export interface TimeSeriesSummary {
  userId: string;
  windowStart: number;
  windowEnd: number;
  avgBpm: number;
  minBpm: number;
  maxBpm: number;
  sampleCount: number;
  signalQuality: number; // 0.0 to 1.0 (estimated by noise and density)
  tachycardiaDurationMs: number; // Duration of BPM > threshold
  stressScoreAvg?: number;
  anomalyCount: number; // E.g., noise spikes or missed packets
}

// TimescaleDB Table schemas conceptualization (Future Migration)
export const TIMESCALE_SCHEMA_DOC = `
-- Hypertable structure for raw telemetry (sharded by time and userId)
CREATE TABLE raw_telemetry (
    time TIMESTAMPTZ NOT NULL,
    user_id UUID NOT NULL,
    bpm SMALLINT NOT NULL,
    hrv SMALLINT,
    stress_level SMALLINT
);
SELECT create_hypertable('raw_telemetry', 'time');

-- Summary table (Rollups / Continuous Aggregates)
-- Allows ultra-fast queries for weekly trends without scanning millions of raw rows
CREATE TABLE telemetry_summaries (
    window_start TIMESTAMPTZ NOT NULL,
    user_id UUID NOT NULL,
    avg_bpm REAL NOT NULL,
    min_bpm SMALLINT NOT NULL,
    max_bpm SMALLINT NOT NULL,
    sample_count INTEGER NOT NULL,
    signal_quality REAL,
    tachycardia_duration_ms INTEGER DEFAULT 0,
    anomaly_count INTEGER DEFAULT 0
);
SELECT create_hypertable('telemetry_summaries', 'window_start');
`;
