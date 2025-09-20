import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VerificationTokensModule } from 'src/verification_tokens/verification_tokens.module';
import { PasswordResetsModule } from 'src/password_resets/password_resets.module';
import { JwtStrategy } from 'src/common/jwt/jwt.strategy';

@Module({
  imports:[ 
    UsersModule,
    VerificationTokensModule,
    PasswordResetsModule,
    JwtModule.registerAsync({
  
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: {
        expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRE'),
    },
  }),
  inject: [ConfigService],
}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
