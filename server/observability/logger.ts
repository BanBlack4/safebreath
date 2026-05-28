import { traceContextStorage } from './tracing';

/**
 * Structured Logging Facade
 * 
 * Provides a standardized way to emit logs.
 * In production, this should wrap 'pino' or 'winston' to output 
 * highly searchable NDJSON (Newline Delimited JSON).
 */
export class Logger {
  private formatMessage(level: string, message: string, meta?: any) {
    const traceCtx = traceContextStorage.getStore();
    
    const logObj = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId: traceCtx?.traceId,
      userId: traceCtx?.userId,
      ...meta
    };
    
    // In local dev we might want pretty printing.
    // In prod, this should always be stringified JSON.
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(logObj);
    } else {
      const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
      return `[${logObj.timestamp}] [${level}] ${message}${metaStr}`;
    }
  }

  public info(message: string, meta?: any) {
    console.log(this.formatMessage('INFO', message, meta));
  }

  public warn(message: string, meta?: any) {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  public error(message: string, error?: any, meta?: any) {
    const errorMeta = error instanceof Error 
      ? { err_message: error.message, stack: error.stack }
      : { err: error };
      
    console.error(this.formatMessage('ERROR', message, { ...meta, ...errorMeta }));
  }

  public debug(message: string, meta?: any) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(this.formatMessage('DEBUG', message, meta));
    }
  }
}

export const logger = new Logger();
