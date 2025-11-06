import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json } from 'body-parser';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // const port = process.env.PORT || '';
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

  // Security headers với Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https://storage.googleapis.com'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Task 47: Response compression để giảm bandwidth
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024, // Chỉ nén response > 1KB
      level: 6, // Compression level (0-9, 6 là balanced)
    }),
  );

  // Cookie parser cho CSRF
  app.use(cookieParser());

  // Task 47: Response compression
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      level: 6, // Compression level (0-9)
      threshold: 1024, // Only compress responses larger than 1KB
    }),
  );

  // Task 42: Logging middleware
  const loggingMiddleware = new LoggingMiddleware();
  app.use((req, res, next) => loggingMiddleware.use(req, res, next));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // Reject unknown properties
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  app.setGlobalPrefix('api', { exclude: [''] });
  app.use(json({ limit: '10mb' }));

  // Bật CORS cho FE, dùng khi FE và BE khác port để tránh bị chặn
  const frontendOrigin =
    configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';
  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // HTTPS enforcement in production
  if (nodeEnv === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  // Task 44-45: Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Say2Hand API')
    .setDescription('Second-hand marketplace API documentation')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('posts', 'Post/Listing management')
    .addTag('categories', 'Category management')
    .addTag('transactions', 'Transaction management')
    .addTag('conversations', 'Chat/Messaging')
    .addTag('notifications', 'Notification management')
    .addTag('ratings', 'Rating and review management')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Say2Hand API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
    ],
  });

  // Gọi listen() trước để khởi động server
  await app.listen(port);

  // Sau đó mới gọi getUrl() để lấy địa chỉ
  await app.getUrl();

  logger.log(`Server is running on: http://localhost:${port}`);
  logger.log(`Environment: ${nodeEnv}`);
  logger.log(`CORS enabled for: ${frontendOrigin}`);
  logger.log(`API Documentation: http://localhost:${port}/api/docs`);
}

void bootstrap();
