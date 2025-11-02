import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VerificationTokensModule } from '../verification_tokens/verification_tokens.module';
import { PasswordResetsModule } from '../password_resets/password_resets.module';
import { JwtStrategy } from '../../common/jwt/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    VerificationTokensModule,
    PasswordResetsModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_ACCESS_TOKEN_EXPIRE',
          ) as any, // Ép kiểu any để phù hợp với yêu cầu của NestJS JWT
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
