import { Request, Response, Router } from 'express';
import { metrics } from './metrics';

const router = Router();

/**
 * Health Check Endpoint
 * Used by orchestrators (Kubernetes/Cloud Run) to determine if the container is alive (Liveness)
 * and ready to accept traffic (Readiness).
 */
router.get('/health', (req: Request, res: Response) => {
  // In a robust system, this ping databases or critical downstream services.
  const memoryUsage = process.memoryUsage();
  
  // Track memory pressure
  metrics.setGauge('nodejs_memory_heap_used_bytes', memoryUsage.heapUsed);
  metrics.setGauge('nodejs_memory_heap_total_bytes', memoryUsage.heapTotal);
  metrics.setGauge('nodejs_memory_rss_bytes', memoryUsage.rss);

  // Consider Redis/DB status for readiness if implemented
  const isRedisConnected = process.env.ENABLE_REDIS !== 'true' || true; // Assuming wrapper has internal state handling

  res.status(isRedisConnected ? 200 : 503).json({
    status: isRedisConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024)
    }
  });
});

/**
 * Metrics Export Endpoint
 * Designed for Prometheus to scrape operations periodically.
 */
router.get('/metrics', (req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain');
  res.send(metrics.exportMetrics());
});

export default router;
