// Task 46: Redis Cache Configuration
import { Module, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheConfig');
        const redisHost =
          configService.get<string>('REDIS_HOST') || 'localhost';
        const redisPort = configService.get<number>('REDIS_PORT') || 6379;
        const redisPassword = configService.get<string>('REDIS_PASSWORD');

        try {
          const store = await redisStore({
            host: redisHost,
            port: redisPort,
            password: redisPassword,
            ttl: 60 * 1000, // Default TTL: 1 minute (in milliseconds)
            maxRetriesPerRequest: 3,
            enableReadyCheck: false, // Tắt ready check để không block app
            lazyConnect: true, // Connect khi cần, không block startup
            retryStrategy: (times: number) => {
              if (times > 3) {
                logger.warn(
                  'Redis connection failed after 3 retries. Caching disabled.',
                );
                return null; // Stop retrying
              }
              return Math.min(times * 50, 2000); // Exponential backoff
            },
          });

          // Handle Redis connection errors gracefully
          const client = (store as any).client;
          if (client) {
            client.on('error', (err: Error) => {
              logger.warn(
                `Redis connection error: ${err.message}. App will continue without caching.`,
              );
            });
            client.on('connect', () => {
              logger.log('✅ Redis connected successfully');
            });
          }

          return { store };
        } catch (error) {
          logger.warn(
            `Failed to initialize Redis cache: ${error.message}. Using memory cache fallback.`,
          );
          // Fallback to memory cache if Redis fails
          return {
            ttl: 60 * 1000,
            max: 100, // Max items in memory cache
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class CacheConfigModule {}
