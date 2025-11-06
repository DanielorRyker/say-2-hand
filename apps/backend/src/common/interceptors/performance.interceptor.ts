// Task 50: Performance Monitoring Interceptor
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance');
  private readonly slowThreshold = 1000; // 1 second

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log slow queries
        if (duration > this.slowThreshold) {
          this.logger.warn(
            `Slow request detected: ${method} ${url} - ${duration}ms`,
          );
        }

        // Log to metrics (có thể integrate với Prometheus sau)
        this.logMetrics(method, url, duration);
      }),
    );
  }

  private logMetrics(method: string, url: string, duration: number) {
    // Track metrics for monitoring dashboard
    // Future: Export to Prometheus, Datadog, etc.
    const metrics = {
      timestamp: new Date().toISOString(),
      method,
      url,
      duration,
      memory: process.memoryUsage(),
    };

    // For now, log to console (production: send to monitoring service)
    if (duration > 500) {
      this.logger.debug(`Metrics: ${JSON.stringify(metrics)}`);
    }
  }
}
