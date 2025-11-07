import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 👈 lấy token từ header Authorization
      ignoreExpiration: false, // tự động check expired
      secretOrKey: process.env.JWT_SECRET || 'supersecret',
    });
  }

  validate(payload: any) {
    // Payload = { sub: userId, username: email }
    return { userId: payload.sub, email: payload.username };
  }
}
