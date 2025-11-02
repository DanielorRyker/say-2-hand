import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const getJwtConfig = (
  configService: ConfigService,
): JwtModuleOptions => {
  return {
    secret:
      configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key',
    signOptions: {
      // Ép kiểu sang any để phù hợp với JwtModuleOptions (number | StringValue | undefined)
      expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '24h') as any,
    },
  };
};
