// Task 42: HTTP Request/Response Logging Middleware
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    // Log request
    this.logger.log(`[Request] ${method} ${originalUrl} - IP: ${ip}`);

    // Capture response
    res.on('finish', () => {
      const { statusCode } = res;
      const responseTime = Date.now() - startTime;
      const contentLength = res.get('content-length') || 0;

      const logLevel =
        statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'log';

      this.logger[logLevel](
        `[Response] ${method} ${originalUrl} ${statusCode} - ${responseTime}ms - ${contentLength} bytes - ${userAgent}`,
      );

      // Log slow requests (> 1000ms)
      if (responseTime > 1000) {
        this.logger.warn(
          `[Slow Request] ${method} ${originalUrl} took ${responseTime}ms`,
        );
      }
    });

    next();
  }
}
