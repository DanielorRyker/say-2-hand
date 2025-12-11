import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
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
@Module({
  imports: [
    // ThrottlerModule cấu hình rate limit toàn cục (có thể override ở controller)
    ThrottlerModule.forRoot({
      throttlers: [
        {
          limit: 5,
          ttl: 60, // 60 giây
        },
      ],
      errorMessage:
        'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.',
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587, // ✅ cổng chính xác
          secure: false, // true nếu dùng 465, false nếu dùng 587
          auth: {
            user: configService.get<string>('MAIL_USER'), // ví dụ: studies.mail.2024@gmail.com
            pass: configService.get<string>('MAIL_PASSWORD'), // App Password, KHÔNG phải mật khẩu Gmail thường
          },
           tls: {
            rejectUnauthorized: false, // ⚡ Fix lỗi TLS trên Render
          },
        },
        defaults: {
          from: `"Say2hand" <${configService.get<string>('MAIL_USER')}>`, // sửa cho đẹp domain
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({ isGlobal: true }),

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
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
