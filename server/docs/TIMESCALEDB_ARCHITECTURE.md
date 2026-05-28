# TimescaleDB Integration Architecture

## 1. Why TimescaleDB Fits Telemetry Workloads
Standard relational databases (PostgreSQL/MySQL) struggle heavily with massive, continuous insert volumes (Time-Series workloads). B-Tree indexes become deeply fragmented and swap to disk, drastically slowing down ingestion.

TimescaleDB solves this by extending PostgreSQL with **Hypertables**. 
- To the application, a Hypertable looks like a standard table (e.g., `telemetry_raw`).
- Under the hood, TimescaleDB automatically partitions the data into time-based **Chunks** (e.g., one chunk per day).
- When inserting data, the DB only writes to the *most recent chunk*. The B-Tree index for that single chunk is small enough to remain entirely in RAM (Memory), ensuring ingestion speeds stay blazing fast horizontally, without locks or degradation over time.

## 2. Hypertable and Partitioning Strategy
- **`telemetry_raw`:** Chunk interval is `1 day`. Given high-frequency ingestion (even downsampled), a 1-day chunk ensures memory bounds are respected.
- **`telemetry_summaries`:** Chunk interval is `7 days`. This table holds our batched 1-minute aggregations, meaning row count is 1/60th or less of raw data.

## 3. Storage Efficiency (Compression Lifecycles)
TimescaleDB utilizes columnar compression natively.
- By segmenting compression by `user_id` and ordering by `time DESC`, similar values sit adjacent in memory resulting in **90-95% compression ratios**.
- **The Tradeoff:** Compressed chunks become essentially append-only (or very expensive to update/delete isolated rows). Therefore, we only compress data once it leaves the "operational window" (e.g., after 7 days when anomalies have been fully evaluated).

## 4. Query Optimization & Continuous Aggregates
Continuous aggregates solve the expensive analytical query problem. 
- A request to calculate a user's monthly average heart rate involves summing potentially millions of rows. 
- With a `telemetry_hourly_summary` materialized continuous aggregate, TimescaleDB recalculates the aggregation incrementally in the background as new batches arrive. The dashboard UI fetches data in milliseconds.

## 5. Retention and Operational Data Lifecycle
Storing infinite telemetry leads to exponential infrastructure costs.
- **Data Eviction:** Using `add_retention_policy`, Timescale gracefully `DROP TABLE`s the oldest chunks entirely. This completely avoids the traditional PostgreSQL `VACUUM` overhead and dead-tuple bloat that ruins standard database performance during mass deletes.
- **Policy:** Raw telemetry is wiped after 90 days. Aggregated summaries are kept for 1 year for baseline compliance.

## 6. Write Amplification Mitigation & Telemetry Buffering
Even with TimescaleDB, doing `INSERT` statements per heartbeat (e.g., 5Hz per user per websocket) causes catastrophic TCP connection overhead and IOPS exhaustion.
- Our node architecture (implemented in `TelemetryBuffer`) gathers 60 seconds of packets and squashes them into a single memory block.
- We perform **Bulk Inserts** (`COPY` or batch `INSERT ... VALUES`) asynchronously. 
- **Graceful Degradation:** The Circuit Breaker ensures if TimescaleDB locks up or undergoes maintenance, we drop batches gracefully rather than crashing the WebSocket layer. Real-time Emergency rules are preserved via Redis.

## 7. Machine Learning Workload Preparation
TimescaleDB allows SQL querying bridging the gap to Data Science pipelines:
- Python tools (Pandas) interact seamlessly.
- Extracting "Tachycardia Persistence combined with HRV anomalies" across the population is purely relational SQL.
- Vector integrations (pgvector) can be run alongside TimescaleDB for similarity searches in physiological signatures.
