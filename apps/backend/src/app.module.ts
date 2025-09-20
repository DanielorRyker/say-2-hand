import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { VerificationTokensModule } from './verification_tokens/verification_tokens.module';
import { PasswordResetsModule } from './password_resets/password_resets.module';
import { PostsModule } from './posts/posts.module';
import { UploadModule } from './upload/upload.module';
import { CategoriesModule } from './categories/categories.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';

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
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
