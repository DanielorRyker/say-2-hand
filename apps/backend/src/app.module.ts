import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
    ConfigModule.forRoot({ isGlobal: true }),
    // MongooseModule.forRoot(process.env.MONGODB_URI || ''),

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
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
})
export class AppModule {}
