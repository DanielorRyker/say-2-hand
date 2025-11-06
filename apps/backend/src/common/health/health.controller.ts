// Task 41: Health Check Controller
import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}

  // Basic health check
  @Get()
  @ApiOperation({
    summary: 'Basic health check',
    description: 'Check if the service is running',
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  // Database health check
  @Get('db')
  checkDatabase() {
    try {
      const state = this.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      const isHealthy = state === 1;

      return {
        status: isHealthy ? 'ok' : 'error',
        database: states[state as keyof typeof states] || 'unknown',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'error',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Memory usage check
  @Get('memory')
  checkMemory() {
    const memoryUsage = process.memoryUsage();
    const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

    return {
      status: 'ok',
      memory: {
        rss: `${formatBytes(memoryUsage.rss)} MB`,
        heapTotal: `${formatBytes(memoryUsage.heapTotal)} MB`,
        heapUsed: `${formatBytes(memoryUsage.heapUsed)} MB`,
        external: `${formatBytes(memoryUsage.external)} MB`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Detailed health check for monitoring systems
  @Get('detailed')
  detailedCheck() {
    const dbHealth = this.checkDatabase();
    const memoryInfo = this.checkMemory();

    const isHealthy = dbHealth.status === 'ok';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      checks: {
        database: dbHealth,
        memory: memoryInfo,
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
