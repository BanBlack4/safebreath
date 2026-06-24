import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { traceContextStorage } from '../../../server/observability/tracing';

/**
 * Global Tracing Interceptor
 * Replaces the Express middleware and WS handlers for open telemetry.
 * Captures `x-correlation-id` and sets it inside the AsyncLocalStorage wrapper.
 */
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const type = context.getType();
    let traceId = uuidv4();

    if (type === 'http') {
      const request = context.switchToHttp().getRequest();
      traceId = request.headers['x-correlation-id'] || traceId;
      request.traceId = traceId; // make it available natively 
    } else if (type === 'ws') {
      const client = context.switchToWs().getClient();
      // Access handshake headers or parse from payload if available
      // Note: NestWS adapters usually drop headers on individual messages, so we look at handshake
      const req = client.upgradeReq || client.request;
      traceId = req?.headers?.['x-correlation-id'] || traceId;
    }

    return new Observable((subscriber) => {
      // Execute the entire NestJS handler stack within the preserved async context!
      traceContextStorage.run({ traceId }, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
