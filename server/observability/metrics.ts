export interface HistogramMetric {
  count: number;
  sum: number;
  min: number;
  max: number;
  // A simple implementation for demonstration. In production, use prom-client for true histograms/quantiles.
}

/**
 * Lightweight Metrics Registry (Prometheus Preparation)
 * 
 * Collects internal operational metrics with minimal overhead.
 * Designed to be a drop-in replacement boundary for standard 
 * libraries like `prom-client` or OpenTelemetry metrics.
 */
export class MetricsRegistry {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, HistogramMetric> = new Map();

  // --- Counters ---
  public increment(name: string, value: number = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  // --- Gauges ---
  public setGauge(name: string, value: number) {
    this.gauges.set(name, value);
  }

  public incrementGauge(name: string, value: number = 1) {
    const current = this.gauges.get(name) || 0;
    this.gauges.set(name, current + value);
  }

  public decrementGauge(name: string, value: number = 1) {
    const current = this.gauges.get(name) || 0;
    this.gauges.set(name, current - value);
  }

  // --- Histograms / Timers ---
  public observe(name: string, value: number) {
    let hist = this.histograms.get(name);
    if (!hist) {
      hist = { count: 0, sum: 0, min: Number.MAX_VALUE, max: Number.MIN_VALUE };
      this.histograms.set(name, hist);
    }
    hist.count += 1;
    hist.sum += value;
    if (value < hist.min) hist.min = value;
    if (value > hist.max) hist.max = value;
  }

  /**
   * Helper to measure execution duration of a synchronous or asynchronous block.
   */
  public async measureDuration<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      this.observe(name, performance.now() - start);
    }
  }

  /**
   * Exports metrics in a Prometheus-like format (simplified).
   */
  public exportMetrics(): string {
    const lines: string[] = [];
    
    this.counters.forEach((val, name) => {
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name} ${val}`);
    });
    
    this.gauges.forEach((val, name) => {
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${val}`);
    });
    
    this.histograms.forEach((val, name) => {
      lines.push(`# TYPE ${name} summary`);
      lines.push(`${name}_count ${val.count}`);
      lines.push(`${name}_sum ${val.sum}`);
      // Simple average calculation as a stand-in for quantiles
      lines.push(`${name}_avg ${val.count > 0 ? val.sum / val.count : 0}`);
    });

    return lines.join('\n');
  }
}

export const metrics = new MetricsRegistry();
