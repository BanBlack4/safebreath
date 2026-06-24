-- SafeBreath TimescaleDB Schema Architecture
-- Requires PostgreSQL with TimescaleDB extension installed

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- 1. Raw Telemetry Table
-- Although we batch using TelemetryBuffer, we might still want to store semi-raw telemetry 
-- on a granular basis (e.g., 1 reading per 5 seconds instead of 10Hz)
CREATE TABLE telemetry_raw (
    time TIMESTAMPTZ NOT NULL,
    user_id UUID NOT NULL,
    bpm SMALLINT NOT NULL,
    hrv SMALLINT,
    stress_level SMALLINT,
    signal_quality REAL,
    device_id VARCHAR(50)
);

-- Convert to Hypertable
-- chunk_time_interval: 1 day (telemetry volume is high, 1-day chunks keep index sizes in memory)
SELECT create_hypertable('telemetry_raw', 'time', chunk_time_interval => INTERVAL '1 day');

-- Create secondary index on user_id and time for fast user-specific historical lookups
CREATE INDEX ix_telemetry_raw_user_time ON telemetry_raw (user_id, time DESC);

-- 2. Telemetry Summaries Table
-- This matches the output of the TelemetryBuffer (e.g. 1-minute aggregates)
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

-- Convert to Hypertable
-- chunk_time_interval: 7 days (summaries are smaller, 7-day chunks are efficient)
SELECT create_hypertable('telemetry_summaries', 'window_start', chunk_time_interval => INTERVAL '7 days');
CREATE INDEX ix_telemetry_summaries_user_time ON telemetry_summaries (user_id, window_start DESC);

-- 3. Continuous Aggregates (Materialized Views)
-- For rendering UI charts (e.g., hourly trends, daily health scores)
-- Timescale automatically refreshes these efficiently in the background
CREATE MATERIALIZED VIEW telemetry_hourly_summary
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', window_start) AS hour_bucket,
       user_id,
       AVG(avg_bpm) as hourly_avg_bpm,
       MAX(max_bpm) as hourly_max_bpm,
       MIN(min_bpm) as hourly_min_bpm,
       SUM(tachycardia_duration_ms) as total_tachycardia_ms,
       AVG(signal_quality) as hourly_signal_quality
FROM telemetry_summaries
GROUP BY time_bucket('1 hour', window_start), user_id;

-- 4. Compression Policy
-- Compress raw telemetry older than 7 days (saves up to 90% space)
ALTER TABLE telemetry_raw SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'user_id',
  timescaledb.compress_orderby = 'time DESC'
);
SELECT add_compression_policy('telemetry_raw', INTERVAL '7 days');

-- Compress 1-minute summaries older than 30 days
ALTER TABLE telemetry_summaries SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'user_id',
  timescaledb.compress_orderby = 'window_start DESC'
);
SELECT add_compression_policy('telemetry_summaries', INTERVAL '30 days');

-- 5. Retention Policy (Data Lifecycle Management)
-- Drop raw telemetry older than 90 days (Compliance/Cost control)
SELECT add_retention_policy('telemetry_raw', INTERVAL '90 days');

-- Keep summaries for 1 year
SELECT add_retention_policy('telemetry_summaries', INTERVAL '1 year');
-- (Hourly continuous aggregates can be kept longer depending on requirements)
