import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { AsyncLocalStorage } from 'async_hooks';

// Setup highly efficient AsyncLocalStorage for Context Propagation
// Useful when we need to inject Correlation IDs into our custom logger seamlessly
export interface TraceContext {
  traceId: string;
  spanId?: string;
  userId?: string;
}

export const traceContextStorage = new AsyncLocalStorage<TraceContext>();

/**
 * OpenTelemetry Setup 
 * Must be required in server.ts BEFORE any other module (like express or redis) 
 * to ensure auto-instrumentation hooks properly monkey-patch the libraries.
 */
export function setupTracing() {
  const traceExporter = new OTLPTraceExporter({
    // Export to Grafana Tempo or Jaeger Collector
    url: process.env.OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      'service.name': 'safebreath-backend',
      'service.version': '1.0.0',
    }),
    traceExporter,
    // Auto-instruments Express, HTTP, ioredis, pg, and more natively!
    instrumentations: [getNodeAutoInstrumentations()]
  });

  sdk.start();
  
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error));
  });
}
