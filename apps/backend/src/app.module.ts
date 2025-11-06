import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './config/database.config';
import { getJwtConfig } from './config/jwt.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { VerificationTokensModule } from './modules/verification_tokens/verification_tokens.module';
import { PasswordResetsModule } from './modules/password_resets/password_resets.module';
import { PostsModule } from './modules/posts/posts.module';
import { UploadModule } from './modules/upload/upload.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ChatGateway } from './common/socket/chat.gateway';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { QrModule } from './modules/qr/qr.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { GeminiModule } from './modules/gemini/gemini.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { validationSchema } from './config/env.validation';
import { HealthModule } from './common/health/health.module';
import { CacheConfigModule } from './config/cache.config';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';

@Module({
  imports: [
    // Rate limiting configuration - Adjusted for better UX
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 giây
        limit: 10, // 10 requests (tăng từ 3 để cho phép load trang)
      },
      {
        name: 'medium',
        ttl: 10000, // 10 giây
        limit: 50, // 50 requests (tăng từ 20)
      },
      {
        name: 'long',
        ttl: 60000, // 1 phút
        limit: 100, // 100 requests
      },
    ]),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465, // ✅ cổng chính xác
          secure: true, // true nếu dùng 465, false nếu dùng 587
          auth: {
            user: configService.get<string>('MAIL_USER'), // ví dụ: studies.mail.2024@gmail.com
            pass: configService.get<string>('MAIL_PASSWORD'), // App Password, KHÔNG phải mật khẩu Gmail thường
          },
        },
        defaults: {
          from: '"No Reply" <no-reply@say2hand.com>', // sửa cho đẹp domain
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema, // Validate env variables at startup
    }),
    CacheConfigModule, // Task 46: Redis caching

    // JWT Module (global) - Cần cho ChatGateway và các services khác
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getJwtConfig(configService),
      inject: [ConfigService],
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    VerificationTokensModule,
    PasswordResetsModule,
    PostsModule,
    UploadModule,
    CategoriesModule,
    ConversationsModule,
    MessagesModule,
    FavoritesModule,
    TransactionsModule,
    NotificationsModule,
    QrModule,
    ReportsModule,
    RatingsModule,
    GeminiModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ChatGateway,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Apply rate limiting globally
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor, // Task 50: Performance monitoring
    },
  ],
})
export class AppModule {}
